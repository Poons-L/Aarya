import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { contact_id } = await req.json();

    if (!contact_id) {
      return new Response(
        JSON.stringify({ error: "contact_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the contact
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select(
        "id, name, company, title, email, linkedin_url, notes, met_at, profile_summary, enrichment_status"
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

    if (!contact.linkedin_url && !contact.company && !contact.title) {
      return new Response(
        JSON.stringify({
          error: "No enrichable data",
          message:
            "Add a LinkedIn URL, company, or title to enable enrichment.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark as processing
    await supabaseAdmin
      .from("contacts")
      .update({ enrichment_status: "processing" })
      .eq("id", contact_id);

    if (!openaiApiKey) {
      await supabaseAdmin
        .from("contacts")
        .update({ enrichment_status: "failed" })
        .eq("id", contact_id);

      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build context from available data for structured enrichment
    const contextParts: string[] = [];
    contextParts.push(`Name: ${contact.name}`);
    if (contact.title) contextParts.push(`Title: ${contact.title}`);
    if (contact.company) contextParts.push(`Company: ${contact.company}`);
    if (contact.linkedin_url)
      contextParts.push(`LinkedIn URL: ${contact.linkedin_url}`);
    if (contact.email) contextParts.push(`Email: ${contact.email}`);
    if (contact.met_at) contextParts.push(`Met at: ${contact.met_at}`);
    if (contact.notes)
      contextParts.push(`Notes: ${contact.notes}`);

    const systemPrompt = `You are a profile enrichment assistant. Given available information about a professional contact, synthesize structured profile fields. Use only the supplied information — do not invent facts.

Respond with valid JSON:
{
  "profile_headline": "string - a concise professional headline based on title/company",
  "profile_summary": "string - 2-3 sentence professional summary based on available data",
  "profile_keywords": ["string array - 3-8 relevant professional keywords"],
  "profile_region": "string or null - geographic region if inferable",
  "profile_current_focus": "string or null - what they seem focused on professionally",
  "confidence": 0.0 to 1.0
}

If data is too sparse for a field, set it to null. The confidence score reflects how complete and reliable the enrichment is.`;

    const userPrompt = `Enrich this contact profile based on available information:\n\n${contextParts.join("\n")}`;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      await supabaseAdmin
        .from("contacts")
        .update({ enrichment_status: "failed" })
        .eq("id", contact_id);

      throw new Error(
        `OpenAI API error: ${errorData.error?.message || "Unknown"}`
      );
    }

    const aiData = await response.json();
    const rawContent = aiData.choices[0]?.message?.content?.trim();

    let enrichment: {
      profile_headline: string | null;
      profile_summary: string | null;
      profile_keywords: string[] | null;
      profile_region: string | null;
      profile_current_focus: string | null;
      confidence: number;
    };

    try {
      enrichment = JSON.parse(rawContent);
    } catch {
      await supabaseAdmin
        .from("contacts")
        .update({ enrichment_status: "failed" })
        .eq("id", contact_id);
      throw new Error("Failed to parse enrichment response");
    }

    // Update contact with enrichment data
    await supabaseAdmin
      .from("contacts")
      .update({
        enrichment_status: "completed",
        last_enriched_at: new Date().toISOString(),
        profile_headline: enrichment.profile_headline || null,
        profile_summary: enrichment.profile_summary || null,
        profile_keywords: enrichment.profile_keywords || null,
        profile_region: enrichment.profile_region || null,
        profile_current_focus: enrichment.profile_current_focus || null,
        enrichment_confidence: enrichment.confidence || 0,
      })
      .eq("id", contact_id);

    return new Response(
      JSON.stringify({
        success: true,
        enrichment,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error enriching contact:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to enrich contact",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
