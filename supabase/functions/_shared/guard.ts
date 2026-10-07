import { createClient, SupabaseClient, User } from "npm:@supabase/supabase-js@2.57.4";

// Browsers may only call these functions from the app itself. Non-browser callers
// aren't stopped by CORS, which is why every function also requires a signed-in user.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://reme.uplifyt.com",
  "http://localhost:5173",
  "http://localhost:4173",
];
// Bolt.new previews run on these hosts
const ALLOWED_ORIGIN_SUFFIXES = [".bolt.new", ".webcontainer-api.io", ".webcontainer.io"];

function allowedOrigins(): string[] {
  const fromEnv = Deno.env.get("ALLOWED_ORIGINS");
  return fromEnv ? fromEnv.split(",").map((o) => o.trim()).filter(Boolean) : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins().includes(origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && ALLOWED_ORIGIN_SUFFIXES.some((s) => hostname.endsWith(s));
  } catch {
    return false;
  }
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : allowedOrigins()[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: corsHeaders(req) }) : null;
}

export interface AuthedContext {
  user: User;
  /** Client acting as the user: every query is subject to RLS */
  supabase: SupabaseClient;
}

/**
 * Resolves the signed-in user from the request's bearer token.
 * The public anon key is a valid JWT too, so the gateway's JWT check alone is not enough.
 */
export async function requireUser(req: Request): Promise<AuthedContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(req, { error: "Not authenticated" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return json(req, { error: "Not authenticated" }, 401);
  }
  return { user, supabase };
}

/**
 * Per-user daily cap on an AI feature, counted from ai_usage_logs.
 * Returns a 429 response when the cap is reached, otherwise null.
 */
export async function enforceDailyLimit(
  req: Request,
  ctx: AuthedContext,
  featureType: string,
  dailyLimit: number,
): Promise<Response | null> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await ctx.supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.user.id)
    .eq("feature_type", featureType)
    .gte("created_at", startOfDay.toISOString());

  // Fail closed: if usage can't be counted, don't spend on the AI call
  if (error) {
    console.error(`Usage check failed for ${featureType}:`, error.message);
    return json(req, { error: "Could not verify usage limits. Please try again." }, 503);
  }
  if ((count ?? 0) >= dailyLimit) {
    return json(req, {
      error: "DAILY_LIMIT_REACHED",
      message: `Daily limit reached (${dailyLimit}/${dailyLimit}). Try again tomorrow.`,
    }, 429);
  }
  return null;
}

export async function logUsage(
  ctx: AuthedContext,
  featureType: string,
  extra: { contact_id?: string | null; tokens_used?: number | null; success?: boolean; error_message?: string | null } = {},
) {
  const { error } = await ctx.supabase.from("ai_usage_logs").insert({
    user_id: ctx.user.id,
    feature_type: featureType,
    success: true,
    ...extra,
  });
  if (error) console.error(`Failed to log usage for ${featureType}:`, error.message);
}

/** Logs server-side detail but never sends upstream/provider errors to the client */
export function serverError(req: Request, context: string, err: unknown): Response {
  console.error(`${context}:`, err instanceof Error ? err.message : err);
  return json(req, { error: "Something went wrong. Please try again." }, 500);
}
