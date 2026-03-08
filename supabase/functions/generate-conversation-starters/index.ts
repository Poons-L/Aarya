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
      .select("cached_starters, starters_generated_at")
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

    // Build context with priority hierarchy: Recent Interactions > Notes > LinkedIn > Other info
    const hasInteractionHistory = contactData.interaction_history &&
      Array.isArray(contactData.interaction_history) &&
      contactData.interaction_history.length > 0;
    const hasNotes = contactData.notes && contactData.notes.trim().length > 0;
    const hasLinkedIn = contactData.linkedin_url && contactData.linkedin_url.trim().length > 0;
    const hasInterests = contactData.interests && contactData.interests.length > 0;

    // Primary context - what matters most
    const primaryContext: string[] = [];

    // Prioritize recent interaction history (last 3 interactions)
    if (hasInteractionHistory) {
      const recentInteractions = contactData.interaction_history!
        .slice(-3)
        .reverse()
        .map((interaction, idx) => {
          const daysAgo = Math.floor(
            (new Date().getTime() - new Date(interaction.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          const timeRef = daysAgo === 0 ? "today" :
                         daysAgo === 1 ? "yesterday" :
                         daysAgo < 7 ? `${daysAgo} days ago` :
                         `${Math.floor(daysAgo / 7)} weeks ago`;
          return `${idx === 0 ? "Most recent" : timeRef}: ${interaction.note}`;
        });
      primaryContext.push(`Recent Interaction History:\n${recentInteractions.join("\n")}`);
    }

    if (hasNotes) {
      primaryContext.push(`General Notes: ${contactData.notes}`);
    }
    if (hasLinkedIn) {
      primaryContext.push(`LinkedIn: ${contactData.linkedin_url}`);
    }
    if (hasInterests) {
      primaryContext.push(`Interests: ${contactData.interests.join(", ")}`);
    }

    // Secondary context - supporting information
    const secondaryContext = [
      `Name: ${contactData.name}`,
      contactData.title ? `Title: ${contactData.title}` : "",
      contactData.company ? `Company: ${contactData.company}` : "",
      contactData.relationship ? `How you know them: ${contactData.relationship}` : "",
      contactData.tags && contactData.tags.length > 0 ? `Tags: ${contactData.tags.join(", ")}` : "",
      contactData.last_contacted ? `Last contacted: ${contactData.last_contacted}` : "",
    ].filter(Boolean);

    // Build intelligent prompt based on available data
    let prompt = "";

    if (hasInteractionHistory) {
      prompt = `Generate 3 natural, conversational follow-up starters for reconnecting with ${contactData.name}. Use the recent interaction history to create contextually relevant conversation starters that reference specific topics, meetings, or discussions.

${primaryContext.join("\n\n")}

Supporting context:
${secondaryContext.join("\n")}

Guidelines:
- PRIORITIZE the most recent interaction history - reference specific topics, meetings, projects, or discussions mentioned
- If they mentioned specific challenges, projects, or interests, follow up on those naturally
- Make it sound like you genuinely remember your last conversation
- Use casual, friendly language - write like you're texting a colleague or friend
- Each starter should feel like a natural continuation of your relationship
- Keep under 100 characters each
- Be authentic and human - avoid corporate jargon or templates
- Return ONLY 3 starters, one per line, no numbers or bullets`;
    } else if (hasNotes) {
      prompt = `Generate 3 natural, conversational starters to reconnect with ${contactData.name}. Focus primarily on the topics and details mentioned in their notes.

${primaryContext.join("\n\n")}

Supporting context:
${secondaryContext.join("\n")}

Guidelines:
- PRIORITIZE referencing specific topics, events, or projects from the Notes section
- Make it sound like a real person reaching out, not a formal message
- Use casual, friendly language - avoid corporate speak
- Each starter should feel personal and show you remember specific details about them
- Keep under 100 characters each
- Make them feel authentic and genuine, like catching up with a friend
- Return ONLY 3 starters, one per line, no numbers or bullets`;
    } else if (hasLinkedIn || hasInterests) {
      prompt = `Generate 3 natural, conversational starters to reconnect with ${contactData.name}. ${hasLinkedIn ? "Use their LinkedIn profile information to create relevant, personalized messages." : "Use their interests to craft engaging conversation starters."}

${primaryContext.join("\n\n")}

Supporting context:
${secondaryContext.join("\n")}

Guidelines:
- ${hasLinkedIn ? "Reference their professional background, recent posts, or career moves" : "Incorporate their interests naturally"}
- Sound like a real person reaching out, not a template
- Keep it casual and friendly - no corporate jargon
- Show genuine interest in what they're doing
- Keep under 100 characters each
- Make them authentic and human
- Return ONLY 3 starters, one per line, no numbers or bullets`;
    } else {
      prompt = `Generate 3 natural, conversational starters to reconnect with ${contactData.name}.

${secondaryContext.join("\n")}

Guidelines:
- Since detailed notes aren't available, focus on warm, genuine reconnection messages
- Reference their ${contactData.title || "work"} ${contactData.company ? `at ${contactData.company}` : ""} if mentioned
- Sound like a real person reaching out, not a template
- Keep it casual and friendly
- Show genuine interest in catching up
- Keep under 100 characters each
- Make them feel authentic and human
- Return ONLY 3 starters, one per line, no numbers or bullets`;
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
            content:
              "You are a thoughtful friend helping someone reconnect with their contacts. Generate conversation starters that sound natural, human, and genuine - like something a real person would text or say. Avoid corporate language, templates, or overly formal phrasing. Be warm, personal, and conversational.",
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
