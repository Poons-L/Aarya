import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_EMAIL = "Chicchori@gmail.com";
const DAILY_LIMIT = 5;
const MONTHLY_LIMIT = 50;
const CACHE_DAYS = 7;

interface ContactData {
  name: string;
  title?: string;
  company?: string;
  relationship?: string;
  notes?: string;
  tags?: string[];
  interests?: string[];
  linkedin_url?: string;
  last_contacted?: string;
  contactId?: string;
  forceRefresh?: boolean;
  interaction_history?: Array<{
    date: string;
    note: string;
    type: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

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
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const contactData: ContactData = await req.json();

    if (!contactData.contactId) {
      return new Response(
        JSON.stringify({ error: "Contact ID required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isOwner = user.email === OWNER_EMAIL;

    const { data: contact } = await supabase
      .from("contacts")
      .select("cached_starters, starters_generated_at, context_source")
      .eq("id", contactData.contactId)
      .single();

    const now = new Date();
    const cacheExpiryDate = new Date(now.getTime() - CACHE_DAYS * 24 * 60 * 60 * 1000);
    const hasFreshCache = contact?.cached_starters &&
      contact.cached_starters.length > 0 &&
      contact.starters_generated_at &&
      new Date(contact.starters_generated_at) > cacheExpiryDate;

    if (hasFreshCache && !contactData.forceRefresh) {
      const generatedAt = new Date(contact.starters_generated_at);
      const daysAgo = Math.floor((now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24));

      return new Response(
        JSON.stringify({
          starters: contact.cached_starters,
          cached: true,
          generatedAt: contact.starters_generated_at,
          daysAgo,
          context_source: contact.context_source || 'unknown',
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

    if (!isOwner) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: dailyCount } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", "conversation_starters")
        .gte("created_at", today.toISOString());

      if (dailyCount !== null && dailyCount >= DAILY_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "DAILY_LIMIT_REACHED",
            message: `Daily AI limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Try again tomorrow or view your saved starters.`,
            dailyUsed: dailyCount,
            dailyLimit: DAILY_LIMIT,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { count: monthlyCount } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_type", "conversation_starters")
        .gte("created_at", firstOfMonth.toISOString());

      if (monthlyCount !== null && monthlyCount >= MONTHLY_LIMIT) {
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const resetDate = nextMonth.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        });

        return new Response(
          JSON.stringify({
            error: "MONTHLY_LIMIT_REACHED",
            message: `Monthly AI limit reached. Resets on ${resetDate}.`,
            monthlyUsed: monthlyCount,
            monthlyLimit: MONTHLY_LIMIT,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          starters: [
            "AI feature requires an OpenAI API key to be configured.",
            "Please contact the administrator to set up the OPENAI_API_KEY secret.",
            "This feature will generate personalized conversation starters based on the contact's profile.",
          ],
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

    // EXPLICIT RULE HIERARCHY with TypeScript conditionals
    // Rule 1: If interaction_history exists → use last 3 with timestamps
    // Rule 2: Else if notes exist → base on notes content only
    // Rule 3: Else if linkedin_url exists → infer from profile
    // Rule 4: Else → warm peer-level fallback

    type ContextSource = 'interaction_history' | 'notes' | 'linkedin' | 'fallback';
    let contextSource: ContextSource;
    let prompt = "";
    let systemPrompt = "";

    // Secondary context - supporting information (used across all rules)
    const secondaryContext = [
      `Name: ${contactData.name}`,
      contactData.title ? `Title: ${contactData.title}` : "",
      contactData.company ? `Company: ${contactData.company}` : "",
      contactData.relationship ? `How you know them: ${contactData.relationship}` : "",
      contactData.tags && contactData.tags.length > 0 ? `Tags: ${contactData.tags.join(", ")}` : "",
    ].filter(Boolean);

    // RULE 1: Interaction History (highest priority)
    if (contactData.interaction_history &&
        Array.isArray(contactData.interaction_history) &&
        contactData.interaction_history.length > 0) {

      contextSource = 'interaction_history';

      // Extract last 3 interactions with timestamps and specific details
      const recentInteractions = contactData.interaction_history
        .slice(-3)
        .reverse()
        .map((interaction) => {
          const daysAgo = Math.floor(
            (new Date().getTime() - new Date(interaction.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          const timeRef = daysAgo === 0 ? "today" :
                         daysAgo === 1 ? "yesterday" :
                         daysAgo < 7 ? `${daysAgo} days ago` :
                         daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` :
                         `${Math.floor(daysAgo / 30)} months ago`;
          return `[${timeRef}] ${interaction.note}`;
        });

      systemPrompt = `You are helping someone send a WhatsApp or Signal message to a peer.

CRITICAL RULES:
- Write like you're texting a colleague or friend — casual, warm, direct
- NEVER use corporate jargon, formal language, or phrases like "Hope you're well" or "I trust this finds you"
- Quote or reference a SPECIFIC moment, project name, event, location, or topic from the interaction history
- Each starter must be under 2 sentences
- Tone: human, curious, conversational — NOT salesy or formal
- Return ONLY 3 starters, one per line, no numbers or bullets`;

      prompt = `Generate 3 conversation starters to follow up with ${contactData.name}.

RECENT CONVERSATION HISTORY (use specific details from these):
${recentInteractions.join("\n")}

Supporting context:
${secondaryContext.join("\n")}

Requirements:
- Reference something SPECIFIC from the most recent interaction
- If they mentioned a challenge, project, meeting, or event, follow up on it naturally
- Write like you're texting on WhatsApp — keep it real and conversational
- Each starter should feel like you genuinely remember what you discussed
- NO generic corporate language`;

    // RULE 2: Notes only (no interaction history)
    } else if (contactData.notes && contactData.notes.trim().length > 0) {

      contextSource = 'notes';

      systemPrompt = `You are helping someone send a WhatsApp or Signal message to a peer.

CRITICAL RULES:
- Write like you're texting a colleague or friend — casual, warm, direct
- NEVER use phrases like "Hope you're well", "I trust this finds you", or other corporate filler
- Reference CONCRETE details from the notes: specific events, places, interests, projects
- Each starter must be under 2 sentences
- Tone: human, curious, conversational — NOT formal or salesy
- Return ONLY 3 starters, one per line, no numbers or bullets`;

      prompt = `Generate 3 conversation starters for ${contactData.name}.

NOTES (base starters purely on this):
${contactData.notes}

Supporting context:
${secondaryContext.join("\n")}

Requirements:
- Pull SPECIFIC details from the notes (event names, topics, locations, shared interests)
- Write like you're texting on WhatsApp — keep it authentic
- Show you remember specific things about them
- NO corporate speak or generic openers`;

    // RULE 3: LinkedIn URL (infer from profile)
    } else if (contactData.linkedin_url && contactData.linkedin_url.trim().length > 0) {

      contextSource = 'linkedin';

      systemPrompt = `You are helping someone send a WhatsApp or Signal message to a peer.

CRITICAL RULES:
- Write like you're texting a colleague — casual, warm, direct
- NEVER use phrases like "Hope you're well" or "I trust this message finds you"
- Reference their ACTUAL role, company, or a recent professional achievement naturally
- Each starter must be under 2 sentences
- Tone: human, curious, peer-to-peer — NOT formal recruitment or sales language
- Return ONLY 3 starters, one per line, no numbers or bullets`;

      prompt = `Generate 3 conversation starters for ${contactData.name}.

Context:
${secondaryContext.join("\n")}
LinkedIn: ${contactData.linkedin_url}

Requirements:
- Reference their current role or company in a natural, curious way
- Write like you're texting on WhatsApp — genuine peer-to-peer tone
- Ask about their work or recent moves without sounding like a recruiter
- NO corporate language or formal phrases`;

    // RULE 4: Fallback (minimal context)
    } else {

      contextSource = 'fallback';

      systemPrompt = `You are helping someone send a WhatsApp or Signal message to a peer.

CRITICAL RULES:
- Write like you're texting a colleague or friend — casual, warm, direct
- NEVER use phrases like "Hope you're well" or "Long time no talk"
- Keep it warm but not overly familiar since you don't have detailed context
- Each starter must be under 2 sentences
- Tone: human, curious, peer-level — NOT formal or salesy
- Return ONLY 3 starters, one per line, no numbers or bullets`;

      prompt = `Generate 3 warm conversation starters to reconnect with ${contactData.name}.

Context:
${secondaryContext.join("\n")}

Requirements:
- Create genuine, warm reconnection messages
- Write like you're texting on WhatsApp — natural and human
- Reference their ${contactData.title || "work"} ${contactData.company ? `at ${contactData.company}` : ""} if available
- Keep it friendly and curious without being overly personal
- NO corporate speak or generic templates`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content?.trim() || "";
    const starters = generatedText
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
      .slice(0, 3);

    if (starters.length === 0) {
      throw new Error("No starters generated");
    }

    await supabase
      .from("contacts")
      .update({
        cached_starters: starters,
        starters_generated_at: now.toISOString(),
        context_source: contextSource,
      })
      .eq("id", contactData.contactId);

    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      contact_id: contactData.contactId,
      feature_type: "conversation_starters",
      tokens_used: data.usage?.total_tokens || null,
      success: true,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: updatedDailyCount } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_type", "conversation_starters")
      .gte("created_at", today.toISOString());

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: updatedMonthlyCount } = await supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_type", "conversation_starters")
      .gte("created_at", firstOfMonth.toISOString());

    return new Response(
      JSON.stringify({
        starters,
        cached: false,
        generatedAt: now.toISOString(),
        daysAgo: 0,
        context_source: contextSource,
        dailyUsed: updatedDailyCount || 0,
        dailyLimit: isOwner ? null : DAILY_LIMIT,
        monthlyUsed: updatedMonthlyCount || 0,
        monthlyLimit: isOwner ? null : MONTHLY_LIMIT,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating conversation starters:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate conversation starters",
        starters: [
          "How have you been since we last connected?",
          "I'd love to catch up and hear what you've been working on.",
          "Let's schedule a time to reconnect soon!",
        ],
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
