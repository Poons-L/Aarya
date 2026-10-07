import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { enforceDailyLimit, json, logUsage, preflight, requireUser, serverError } from "../_shared/guard.ts";

const DAILY_LIMIT = 20;
const MAX_IMAGE_DATA_LENGTH = 8 * 1024 * 1024;
// Only inline images: an arbitrary URL would make the AI provider fetch it on our behalf
const DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const ctx = await requireUser(req);
    if (ctx instanceof Response) return ctx;

    const { imageData } = await req.json().catch(() => ({}));

    if (!imageData || typeof imageData !== "string") {
      return json(req, { error: "No image data provided" }, 400);
    }
    if (imageData.length > MAX_IMAGE_DATA_LENGTH) {
      return json(req, { error: "Image is too large" }, 413);
    }
    if (!DATA_URL_PATTERN.test(imageData)) {
      return json(req, { error: "Image must be a base64 PNG, JPEG, WebP or GIF data URL" }, 400);
    }

    const limited = await enforceDailyLimit(req, ctx, "process_ocr", DAILY_LIMIT);
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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this image. If it's a business card, identify: name, title, company, email, and phone. Return the raw text exactly as it appears.",
              },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return json(req, { error: "Failed to process image" }, 502);
    }

    const data = await response.json();
    await logUsage(ctx, "process_ocr", { tokens_used: data.usage?.total_tokens ?? null });

    return json(req, { text: data.choices?.[0]?.message?.content ?? "" });
  } catch (error) {
    return serverError(req, "Error in process-ocr function", error);
  }
});
