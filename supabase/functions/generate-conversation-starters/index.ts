import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactData {
  name: string;
  title?: string;
  company?: string;
  relationship?: string;
  notes?: string;
  tags?: string[];
  interests?: string[];
  last_contacted?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

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

    const contactData: ContactData = await req.json();

    const prompt = `Generate 3 thoughtful, specific conversation starters for reconnecting with this contact:

Name: ${contactData.name}
${contactData.title ? `Title: ${contactData.title}` : ""}
${contactData.company ? `Company: ${contactData.company}` : ""}
${contactData.relationship ? `Relationship: ${contactData.relationship}` : ""}
${contactData.tags && contactData.tags.length > 0 ? `Tags: ${contactData.tags.join(", ")}` : ""}
${contactData.interests && contactData.interests.length > 0 ? `Interests: ${contactData.interests.join(", ")}` : ""}
${contactData.notes ? `Notes: ${contactData.notes}` : ""}
${contactData.last_contacted ? `Last contacted: ${contactData.last_contacted}` : ""}

Requirements:
- Make them personal and specific to this contact
- Keep each starter under 100 characters
- Focus on genuine connection, not just business
- Reference their interests, work, or past interactions when possible
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

    return new Response(
      JSON.stringify({ starters }),
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
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
