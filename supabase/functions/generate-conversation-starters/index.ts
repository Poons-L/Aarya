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

    const contextParts = [
      `Name: ${contactData.name}`,
      contactData.title ? `Title: ${contactData.title}` : "",
      contactData.company ? `Company: ${contactData.company}` : "",
      contactData.relationship ? `Relationship: ${contactData.relationship}` : "",
      contactData.tags && contactData.tags.length > 0 ? `Tags: ${contactData.tags.join(", ")}` : "",
      contactData.interests && contactData.interests.length > 0 ? `Interests: ${contactData.interests.join(", ")}` : "",
      contactData.linkedin_url ? `LinkedIn: ${contactData.linkedin_url}` : "",
      contactData.notes ? `Notes: ${contactData.notes}` : "",
      contactData.last_contacted ? `Last contacted: ${contactData.last_contacted}` : "",
    ].filter(Boolean);

    const prompt = `Generate 3 thoughtful, specific conversation starters for reconnecting with this contact:

${contextParts.join("\n")}

Requirements:
- Make them personal and specific to this contact
- Prioritize using information from their Notes, LinkedIn profile, and Interests to create relevant starters
- If notes mention specific topics, events, or projects, reference those
- If interests are listed, incorporate them naturally into conversation starters
- Keep each starter under 100 characters
- Focus on genuine connection, not just business
- Return ONLY 3 starters, one per line
- Do not number them or add bullet points`;

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
              "You are a helpful assistant that generates thoughtful conversation starters for reconnecting with professional and personal contacts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
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
