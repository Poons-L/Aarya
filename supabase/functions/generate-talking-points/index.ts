import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_EMAIL = "Chicchori@gmail.com";
const DAILY_LIMIT = 5;
const MONTHLY_LIMIT = 50;
const CACHE_HOURS = 24;

interface TalkingPointItem {
  text: string;
  source_labels: string[];
}

interface TalkingPointsOutput {
  personalized_opener: string;
  talking_points: TalkingPointItem[];
  follow_up_questions: TalkingPointItem[];
  watchouts: string[];
  confidence: "low" | "medium" | "high";
}

interface SourceSummary {
  sources_used: string[];
  source_count: number;
  contact_record: boolean;
  linkedin: boolean;
  meeting_notes: boolean;
  interaction_history: boolean;
}

interface GroundingContext {
  contact_record: string | null;
  linkedin_summary: string | null;
  recent_interactions: string | null;
  notes: string | null;
  user_context: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contact_id, user_context, force_refresh } = await req.json();

    if (!contact_id) {
      return new Response(
        JSON.stringify({ error: "contact_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache (unless force refresh or user context changed)
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("generated_talking_points")
        .select("*")
        .eq("contact_id", contact_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        const cacheAge =
          Date.now() - new Date(cached.created_at).getTime();
        const isFresh = cacheAge < CACHE_HOURS * 60 * 60 * 1000;
        const sameContext =
          (cached.user_context || "") === (user_context || "");

        if (isFresh && sameContext) {
          return new Response(
            JSON.stringify({
              output: cached.output,
              source_summary: cached.source_summary,
              cached: true,
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }
    }

    // Rate limiting (skip for owner)
    const isOwner = user.email === OWNER_EMAIL;
    if (!isOwner) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: dailyCount } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", "talking_points")
        .gte("created_at", today.toISOString());

      if (dailyCount !== null && dailyCount >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "DAILY_LIMIT_REACHED",
            message: `Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Try again tomorrow.`,
            dailyUsed: dailyCount,
            dailyLimit: DAILY_LIMIT,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const firstOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const { count: monthlyCount } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", "talking_points")
        .gte("created_at", firstOfMonth.toISOString());

      if (monthlyCount !== null && monthlyCount >= MONTHLY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "MONTHLY_LIMIT_REACHED",
            message: `Monthly limit reached (${MONTHLY_LIMIT}). Resets next month.`,
            monthlyUsed: monthlyCount,
            monthlyLimit: MONTHLY_LIMIT,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          output: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ===== RETRIEVAL PHASE =====

    // 1. Get contact record
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select(
        "id, name, company, title, email, phone, linkedin_url, notes, met_at, met_date, interaction_history, profile_summary, profile_keywords, profile_headline, profile_region, profile_current_focus, enrichment_status, enrichment_confidence"
      )
      .eq("id", contact_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!contact) {
      return new Response(
        JSON.stringify({ error: "Contact not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Get recent interactions from contact_interactions table
    const { data: structuredInteractions } = await supabaseAdmin
      .from("contact_interactions")
      .select("*")
      .eq("contact_id", contact_id)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false })
      .limit(5);

    // 3. Also get conversations (legacy interaction data)
    const { data: conversations } = await supabaseAdmin
      .from("conversations")
      .select("id, conversation_date, summary, transcript")
      .eq("contact_id", contact_id)
      .eq("user_id", user.id)
      .order("conversation_date", { ascending: false })
      .limit(5);

    // ===== BUILD GROUNDING CONTEXT =====

    const groundingContext: GroundingContext = {
      contact_record: null,
      linkedin_summary: null,
      recent_interactions: null,
      notes: null,
      user_context: user_context?.trim() || null,
    };

    const sourcesUsed: string[] = [];

    // Contact record context
    const contactParts: string[] = [];
    if (contact.name) contactParts.push(`Name: ${contact.name}`);
    if (contact.title) contactParts.push(`Title: ${contact.title}`);
    if (contact.company) contactParts.push(`Company: ${contact.company}`);
    if (contact.met_at) contactParts.push(`Met at: ${contact.met_at}`);
    if (contact.met_date)
      contactParts.push(`Met on: ${contact.met_date}`);

    if (contactParts.length > 1) {
      groundingContext.contact_record = contactParts.join("\n");
      sourcesUsed.push("Contact Record");
    }

    // LinkedIn / enrichment context
    if (
      contact.profile_summary ||
      contact.profile_headline ||
      contact.profile_current_focus
    ) {
      const linkedinParts: string[] = [];
      if (contact.profile_headline)
        linkedinParts.push(`Headline: ${contact.profile_headline}`);
      if (contact.profile_summary)
        linkedinParts.push(`Summary: ${contact.profile_summary}`);
      if (contact.profile_current_focus)
        linkedinParts.push(`Current focus: ${contact.profile_current_focus}`);
      if (contact.profile_region)
        linkedinParts.push(`Region: ${contact.profile_region}`);
      if (
        contact.profile_keywords &&
        contact.profile_keywords.length > 0
      )
        linkedinParts.push(
          `Keywords: ${contact.profile_keywords.join(", ")}`
        );

      groundingContext.linkedin_summary = linkedinParts.join("\n");
      sourcesUsed.push("LinkedIn");
    }

    // Notes context
    if (contact.notes && contact.notes.trim().length > 0) {
      groundingContext.notes = contact.notes;
      sourcesUsed.push("Meeting Notes");
    }

    // Interaction history context
    const interactionTexts: string[] = [];

    if (structuredInteractions && structuredInteractions.length > 0) {
      for (const interaction of structuredInteractions) {
        const dateStr = new Date(
          interaction.interaction_date
        ).toLocaleDateString();
        const text =
          interaction.summary || interaction.raw_text || "";
        if (text) {
          interactionTexts.push(
            `[${dateStr} - ${interaction.source_type}] ${text}`
          );
        }
      }
    }

    if (conversations && conversations.length > 0) {
      for (const conv of conversations) {
        const dateStr = new Date(
          conv.conversation_date
        ).toLocaleDateString();
        const text = conv.summary || conv.transcript || "";
        if (text) {
          interactionTexts.push(`[${dateStr} - conversation] ${text}`);
        }
      }
    }

    // Also include legacy interaction_history from contact record
    if (
      contact.interaction_history &&
      Array.isArray(contact.interaction_history) &&
      contact.interaction_history.length > 0
    ) {
      const recentLegacy = contact.interaction_history.slice(-5);
      for (const entry of recentLegacy) {
        if (entry.note) {
          const dateStr = entry.date
            ? new Date(entry.date).toLocaleDateString()
            : "unknown date";
          interactionTexts.push(
            `[${dateStr} - ${entry.type || "note"}] ${entry.note}`
          );
        }
      }
    }

    if (interactionTexts.length > 0) {
      groundingContext.recent_interactions = interactionTexts
        .slice(0, 8)
        .join("\n");
      sourcesUsed.push("Interaction History");
    }

    // User context
    if (groundingContext.user_context) {
      sourcesUsed.push("User Context");
    }

    // ===== GROUNDING CHECK =====
    // If fewer than 2 grounding sources available, return empty state
    const groundingSources = [
      groundingContext.contact_record,
      groundingContext.linkedin_summary,
      groundingContext.notes,
      groundingContext.recent_interactions,
    ].filter(Boolean);

    if (groundingSources.length < 2) {
      const sourceSummary: SourceSummary = {
        sources_used: sourcesUsed,
        source_count: sourcesUsed.length,
        contact_record: !!groundingContext.contact_record,
        linkedin: !!groundingContext.linkedin_summary,
        meeting_notes: !!groundingContext.notes,
        interaction_history: !!groundingContext.recent_interactions,
      };

      return new Response(
        JSON.stringify({
          output: null,
          source_summary: sourceSummary,
          empty_state: true,
          message:
            "Add LinkedIn or notes to personalize this.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // ===== GENERATION PHASE =====

    const contextBlock = [
      groundingContext.contact_record
        ? `## Contact Record\n${groundingContext.contact_record}`
        : null,
      groundingContext.linkedin_summary
        ? `## LinkedIn Profile\n${groundingContext.linkedin_summary}`
        : null,
      groundingContext.notes
        ? `## Notes\n${groundingContext.notes}`
        : null,
      groundingContext.recent_interactions
        ? `## Recent Interactions\n${groundingContext.recent_interactions}`
        : null,
      groundingContext.user_context
        ? `## User Context for This Interaction\n${groundingContext.user_context}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const systemPrompt = `You are generating meeting-prep talking points. Use only supplied context. Do not invent facts.

Rules:
- Every talking point MUST reference a specific fact from the supplied context
- Never output generic filler like "looking forward to connecting" or "great to catch up"
- Prefer concise, practical, relationship-oriented suggestions
- Each item must be 1-2 sentences maximum
- If the context mentions specific projects, events, topics, or career moves, reference them
- Source labels must accurately reflect which context section the point draws from

Respond with valid JSON matching this schema exactly:
{
  "personalized_opener": "string - a specific, warm opening line referencing something from context",
  "talking_points": [
    { "text": "string", "source_labels": ["Contact Record" | "LinkedIn" | "Meeting Notes" | "Interaction History"] }
  ],
  "follow_up_questions": [
    { "text": "string", "source_labels": ["Contact Record" | "LinkedIn" | "Meeting Notes" | "Interaction History"] }
  ],
  "watchouts": ["string - optional caution items based on context, can be empty array"],
  "confidence": "low | medium | high"
}

Confidence levels:
- "high": 3+ grounding sources with rich detail
- "medium": 2 grounding sources or sources with limited detail
- "low": minimal context available

Generate 3-5 talking points and exactly 2 follow-up questions.`;

    const userPrompt = `Generate talking points for an upcoming interaction with this contact.

${contextBlock}

Remember: Use ONLY facts from the context above. Do not speculate or invent details.`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices[0]?.message?.content?.trim();

    let output: TalkingPointsOutput;
    try {
      output = JSON.parse(rawContent);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate output structure
    if (
      !output.personalized_opener ||
      !Array.isArray(output.talking_points) ||
      !Array.isArray(output.follow_up_questions)
    ) {
      throw new Error("AI response missing required fields");
    }

    // Ensure talking_points has 3-5 items
    output.talking_points = output.talking_points.slice(0, 5);
    output.follow_up_questions = output.follow_up_questions.slice(0, 2);
    output.watchouts = output.watchouts || [];
    output.confidence = output.confidence || "medium";

    const sourceSummary: SourceSummary = {
      sources_used: sourcesUsed,
      source_count: sourcesUsed.length,
      contact_record: !!groundingContext.contact_record,
      linkedin: !!groundingContext.linkedin_summary,
      meeting_notes: !!groundingContext.notes,
      interaction_history: !!groundingContext.recent_interactions,
    };

    // Save to generated_talking_points table
    await supabaseAdmin.from("generated_talking_points").insert({
      contact_id,
      user_id: user.id,
      user_context: user_context || null,
      output,
      source_summary: sourceSummary,
    });

    // Log usage
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      contact_id,
      feature_type: "talking_points",
      tokens_used: aiData.usage?.total_tokens || null,
      success: true,
    });

    // Get updated usage counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: updatedDailyCount } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_type", "talking_points")
      .gte("created_at", today.toISOString());

    const firstOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const { count: updatedMonthlyCount } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_type", "talking_points")
      .gte("created_at", firstOfMonth.toISOString());

    return new Response(
      JSON.stringify({
        output,
        source_summary: sourceSummary,
        cached: false,
        dailyUsed: updatedDailyCount || 0,
        dailyLimit: isOwner ? null : DAILY_LIMIT,
        monthlyUsed: updatedMonthlyCount || 0,
        monthlyLimit: isOwner ? null : MONTHLY_LIMIT,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating talking points:", error);
    return new Response(
      JSON.stringify({
        error:
          error.message || "Failed to generate talking points",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
