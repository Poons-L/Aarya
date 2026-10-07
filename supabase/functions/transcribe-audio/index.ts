import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { enforceDailyLimit, json, logUsage, preflight, requireUser, serverError } from "../_shared/guard.ts";

const DAILY_LIMIT = 40;
// ~7.5 MB of audio once base64-decoded; Whisper's own cap is 25 MB
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;

Deno.serve(async (req: Request) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const ctx = await requireUser(req);
    if (ctx instanceof Response) return ctx;

    const { audioData, language = "en" } = await req.json().catch(() => ({}));

    if (!audioData || typeof audioData !== "string") {
      return json(req, { error: "Audio data is required" }, 400);
    }
    if (audioData.length > MAX_BASE64_LENGTH) {
      return json(req, { error: "Recording is too long. Please keep it under a few minutes." }, 413);
    }
    if (typeof language !== "string" || !LANGUAGE_PATTERN.test(language)) {
      return json(req, { error: "Invalid language code" }, 400);
    }

    const limited = await enforceDailyLimit(req, ctx, "transcribe_audio", DAILY_LIMIT);
    if (limited) return limited;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return json(req, { error: "AI service is not configured" }, 500);
    }

    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
    } catch {
      return json(req, { error: "Audio data is not valid base64" }, 400);
    }

    const formData = new FormData();
    formData.append("file", new Blob([bytes.buffer as ArrayBuffer], { type: "audio/webm" }), "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", language);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiApiKey}` },
      body: formData,
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return json(req, { error: "Transcription failed. Please try again." }, 502);
    }

    const result = await response.json();
    await logUsage(ctx, "transcribe_audio");

    return json(req, { transcript: result.text });
  } catch (error) {
    return serverError(req, "Error in transcribe-audio function", error);
  }
});
