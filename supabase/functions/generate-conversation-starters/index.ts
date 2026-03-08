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
  user_context_note?: string;
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

    console.log('📥 [Generate Starters] Received contact data:', {
      contactId: contactData.contactId,
      name: contactData.name,
      hasNotes: !!contactData.notes,
      notesLength: contactData.notes?.length || 0,
      notesPreview: contactData.notes ? contactData.notes.substring(0, 100) : null,
      hasInteractionHistory: !!contactData.interaction_history,
      interactionCount: contactData.interaction_history?.length || 0,
      hasLinkedIn: !!contactData.linkedin_url,
      hasUserContextNote: !!contactData.user_context_note,
      userContextNotePreview: contactData.user_context_note ? contactData.user_context_note.substring(0, 50) : null,
    });

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
      console.log('✅ [Generate Starters] Using context_source: interaction_history (found', contactData.interaction_history.length, 'interactions)');

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

      systemPrompt = `You are Re.Me, a personal networking memory that writes WhatsApp-style openers.

General rules:
- Write like a human texting a peer, not a salesperson
- Avoid clichés like "Hope you are well" or corporate jargon
- Always produce exactly 3 starters, each under 2 sentences
- Tone: warm, specific, curious, non-salesy

You receive:
- contact_name
- interaction_history (last 1-3 interactions with timestamps)
- optional notes (informal memory from the user)
- optional linkedin_url/role context
- context_source = interaction_history

For context_source = "interaction_history":
- Read the last 1-3 interactions carefully
- Extract 2-3 specific details (projects, topics, events, locations, people mentioned)
- Each starter MUST reference at least one of those concrete details
- If they mentioned a challenge, project, meeting, or event, follow up on it naturally
- Write like you're texting on WhatsApp — keep it real and conversational
- Each starter should feel like you genuinely remember what you discussed
${contactData.user_context_note ? `- IMPORTANT: User just said they want to focus on: "${contactData.user_context_note}" — at least one starter MUST directly reflect this` : ''}`;

      prompt = `Generate 3 conversation starters to follow up with ${contactData.name}.

RECENT CONVERSATION HISTORY (use specific details from these):
${recentInteractions.join("\n")}

Supporting context:
${secondaryContext.join("\n")}
${contactData.user_context_note ? `\n🎯 USER'S CURRENT FOCUS:\n"${contactData.user_context_note}"\n(At least one starter must directly address this while staying natural)` : ''}

Requirements:
- Reference something SPECIFIC from the most recent interaction
- Write like you're texting on WhatsApp — natural and conversational
- NO generic corporate language${contactData.user_context_note ? '\n- At least one starter must reflect the user\'s current focus above' : ''}`;

    // RULE 2: Notes only (no interaction history)
    } else if (contactData.notes && contactData.notes.trim().length > 0) {

      contextSource = 'notes';
      console.log('✅ [Generate Starters] Using context_source: notes (length:', contactData.notes.length, 'chars)');

      systemPrompt = `You are Re.Me, a personal networking memory that writes WhatsApp-style openers.

General rules:
- Write like a human texting a peer, not a salesperson
- Avoid clichés like "Hope you are well" or corporate jargon
- Always produce exactly 3 starters, each under 2 sentences
- Tone: warm, specific, curious, non-salesy

You receive:
- contact_name
- notes (informal memory/brain dump from the user)
- optional title/company context
- context_source = notes

For context_source = "notes":
HARD REQUIREMENTS (you MUST follow these):
1. Extract 2-3 key facts from notes: how you know each other, where they work now (past company → current company), what you want to learn/do
2. Each of your 3 starters MUST mention at least one of these facts
3. Reference concrete details: specific company names, roles, events, what you want from them
4. Write like you're texting on WhatsApp — keep it authentic and conversational
5. Show you remember specific things about your shared history and what they're doing now
${contactData.user_context_note ? `6. CRITICAL: User just said they want to focus on: "${contactData.user_context_note}" — at least one starter MUST directly reflect this` : ''}`;

      prompt = `Generate 3 conversation starters for ${contactData.name}.

NOTES (you MUST base starters on these details):
${contactData.notes}

Supporting context:
${secondaryContext.join("\n")}
${contactData.user_context_note ? `\n🎯 USER'S CURRENT FOCUS (at least one starter MUST address this):\n"${contactData.user_context_note}"\n` : ''}

MANDATORY requirements:
- Pull SPECIFIC details from the notes (e.g., "worked together at SAP", "now at Google", "leading channel programs", "want tips from him")
- Each starter must mention at least one concrete fact from above
- Write like you're texting on WhatsApp — natural, warm, peer-to-peer
- Show you remember specifics about your history together and what they're doing now
- NO generic lines like "Looking forward to connecting" or "Let's catch up" without specific context
- NO corporate speak${contactData.user_context_note ? '\n- At least one starter must directly reflect the user\'s current focus shown above' : ''}`;

    // RULE 3: LinkedIn URL (infer from profile)
    } else if (contactData.linkedin_url && contactData.linkedin_url.trim().length > 0) {

      contextSource = 'linkedin';
      console.log('✅ [Generate Starters] Using context_source: linkedin');

      systemPrompt = `You are Re.Me, a personal networking memory that writes WhatsApp-style openers.

General rules:
- Write like a human texting a peer, not a salesperson
- Avoid clichés like "Hope you are well" or corporate jargon
- Always produce exactly 3 starters, each under 2 sentences
- Tone: warm, specific, curious, non-salesy

You receive:
- contact_name
- title/company context
- linkedin_url
- context_source = linkedin

For context_source = "linkedin":
- Use role, seniority, company, headline
- Mention something natural (their role, what they lead, an obvious focus) in the starters
- Reference their ACTUAL role or company in a natural, curious way
- Write like you're texting on WhatsApp — genuine peer-to-peer tone
- Ask about their work or recent moves without sounding like a recruiter
${contactData.user_context_note ? `- IMPORTANT: User just said they want to focus on: "${contactData.user_context_note}" — at least one starter MUST directly reflect this` : ''}`;

      prompt = `Generate 3 conversation starters for ${contactData.name}.

Context:
${secondaryContext.join("\n")}
LinkedIn: ${contactData.linkedin_url}
${contactData.user_context_note ? `\n🎯 USER'S CURRENT FOCUS:\n"${contactData.user_context_note}"\n(At least one starter must directly address this while staying natural)` : ''}

Requirements:
- Reference their current role or company in a natural, curious way
- Write like you're texting on WhatsApp — genuine peer-to-peer tone
- Ask about their work without sounding like a recruiter
- NO corporate language or formal phrases${contactData.user_context_note ? '\n- At least one starter must reflect the user\'s current focus above' : ''}`;

    // RULE 4: Fallback (minimal context)
    } else {

      contextSource = 'fallback';
      console.log('✅ [Generate Starters] Using context_source: fallback (no interaction history, notes, or LinkedIn)');

      systemPrompt = `You are Re.Me, a personal networking memory that writes WhatsApp-style openers.

General rules:
- Write like a human texting a peer, not a salesperson
- Avoid clichés like "Hope you are well" or corporate jargon
- Always produce exactly 3 starters, each under 2 sentences
- Tone: warm, specific, curious, non-salesy

You receive:
- contact_name
- minimal context (maybe title/company)
- context_source = fallback

For context_source = "fallback":
- Assume warm but low-context reconnect
- Write 3 simple, friendly openers that don't pretend you remember specific details
- Keep it warm but not overly familiar since you don't have detailed context
- Reference their title/company if available, but keep it natural
${contactData.user_context_note ? `- IMPORTANT: User just said they want to focus on: "${contactData.user_context_note}" — at least one starter MUST directly reflect this` : ''}`;

      prompt = `Generate 3 warm conversation starters to reconnect with ${contactData.name}.

Context:
${secondaryContext.join("\n")}
${contactData.user_context_note ? `\n🎯 USER'S CURRENT FOCUS:\n"${contactData.user_context_note}"\n(At least one starter must directly address this while staying natural)` : ''}

Requirements:
- Create genuine, warm reconnection messages
- Write like you're texting on WhatsApp — natural and human
- Reference their ${contactData.title || "work"} ${contactData.company ? `at ${contactData.company}` : ""} if available
- Keep it friendly and curious without being overly personal
- NO corporate speak or generic templates${contactData.user_context_note ? '\n- At least one starter must reflect the user\'s current focus above' : ''}`;
    }

    const modelName = "gpt-4o";
    console.log(`🤖 [Generate Starters] Using model: ${modelName}`);

    console.log('🧩 [ConversationStarters PROMPT INPUT]', {
      context_source: contextSource,
      notesPreview: contactData.notes?.slice(0, 200),
      userContextNote: contactData.user_context_note,
      hasInteractionHistory: contactData.interaction_history && contactData.interaction_history.length > 0,
      interactionCount: contactData.interaction_history?.length || 0,
      hasLinkedIn: !!contactData.linkedin_url,
      usingModel: modelName,
      systemPromptLength: systemPrompt.length,
      promptLength: prompt.length,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
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
        max_tokens: 300,
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
