import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { enforceDailyLimit, json, logUsage, preflight, requireUser, serverError } from "../_shared/guard.ts";

const DAILY_LIMIT = 30;
const MAX_TEXT_LENGTH = 10_000;

const PROMPTS: Record<string, { system: string; user: (text: string) => string }> = {
  summary: {
    system: "You are a helpful assistant that creates concise summaries of conversations and notes. Extract key points, people mentioned, topics discussed, and action items.",
    user: (text) => `Summarize the following text in 2-3 sentences, highlighting key people, topics, and action items:\n\n${text}`,
  },
  tags: {
    system: "You are a helpful assistant that extracts relevant tags and keywords from text.",
    user: (text) => `Extract 3-5 relevant tags from this text. Return only the tags as a comma-separated list:\n\n${text}`,
  },
  followup: {
    system: "You are a helpful assistant that suggests appropriate follow-up actions based on conversations.",
    user: (text) => `Based on this conversation, suggest a follow-up action with a recommended timeframe (e.g., '3 days', '1 week'):\n\n${text}`,
  },
};

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const ctx = await requireUser(req);
    if (ctx instanceof Response) return ctx;

    const { text, type = "summary" } = await req.json().catch(() => ({}));

    if (!text || typeof text !== "string") {
      return json(req, { error: "Text is required" }, 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json(req, { error: `Text is too long (max ${MAX_TEXT_LENGTH} characters)` }, 413);
    }
    const prompt = PROMPTS[type];
    if (!prompt) {
      return json(req, { error: "Invalid type" }, 400);
    }

    const limited = await enforceDailyLimit(req, ctx, "summarize_text", DAILY_LIMIT);
    if (limited) return limited;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return json(req, { error: "AI service is not configured" }, 500);
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
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user(text) },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return json(req, { error: "Failed to process text" }, 502);
    }

    const result = await response.json();
    const content: string = result.choices?.[0]?.message?.content ?? "";
    await logUsage(ctx, "summarize_text", { tokens_used: result.usage?.total_tokens ?? null });

    if (type === "tags") {
      return json(req, { tags: content.split(",").map((tag) => tag.trim()).filter(Boolean) });
    }
    return json(req, { result: content });
  } catch (error) {
    return serverError(req, "Error in summarize-text function", error);
  }
});
