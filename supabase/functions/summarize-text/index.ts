import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, type = "summary" } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "summary") {
      systemPrompt = "You are a helpful assistant that creates concise summaries of conversations and notes. Extract key points, people mentioned, topics discussed, and action items.";
      userPrompt = `Summarize the following text in 2-3 sentences, highlighting key people, topics, and action items:\n\n${text}`;
    } else if (type === "tags") {
      systemPrompt = "You are a helpful assistant that extracts relevant tags and keywords from text.";
      userPrompt = `Extract 3-5 relevant tags from this text. Return only the tags as a comma-separated list:\n\n${text}`;
    } else if (type === "followup") {
      systemPrompt = "You are a helpful assistant that suggests appropriate follow-up actions based on conversations.";
      userPrompt = `Based on this conversation, suggest a follow-up action with a recommended timeframe (e.g., '3 days', '1 week'):\n\n${text}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;

    if (type === "tags") {
      const tags = content.split(",").map((tag: string) => tag.trim());
      return new Response(
        JSON.stringify({ tags }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ result: content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
