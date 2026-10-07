import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { enforceDailyLimit, json, logUsage, preflight, requireUser, serverError } from "../_shared/guard.ts";

const DAILY_LIMIT = 30;
const MAX_TEXT_LENGTH = 10_000;

interface ContactData {
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  notes: string | null;
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const ctx = await requireUser(req);
    if (ctx instanceof Response) return ctx;

    const { text } = await req.json().catch(() => ({}));

    if (!text || typeof text !== "string") {
      return json(req, { error: "Text is required" }, 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json(req, { error: `Text is too long (max ${MAX_TEXT_LENGTH} characters)` }, 413);
    }

    const limited = await enforceDailyLimit(req, ctx, "smart_paste", DAILY_LIMIT);
    if (limited) return limited;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return json(req, { error: "AI service is not configured" }, 500);
    }

    const systemPrompt = `Extract contact information from the following text and return ONLY a JSON object with these fields (use null if not found): {"first_name": "", "last_name": "", "job_title": "", "company": "", "email": "", "phone": "", "location": "", "linkedin_url": "", "notes": ""}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return json(req, { error: "Failed to process text" }, 502);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return json(req, { error: "No content in response" }, 502);
    }

    const contactData: ContactData = JSON.parse(content);
    await logUsage(ctx, "smart_paste", { tokens_used: result.usage?.total_tokens ?? null });

    return json(req, { success: true, data: contactData });
  } catch (error) {
    return serverError(req, "Error in smart-paste function", error);
  }
});
