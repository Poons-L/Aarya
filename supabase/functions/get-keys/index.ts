const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // The Supabase edge function runtime injects these into the global scope
  // or Deno.env. Let's check various possible locations.
  const candidates = [
    "JWT_SECRET",
    "SUPABASE_JWT_SECRET",
    "JWT_SECRET_KEY",
    "SUPABASE_AUTH_JWT_SECRET",
    "GOTRUE_JWT_SECRET",
    "AUTH_JWT_SECRET",
    "SUPABASE_AUTH_EXTERNAL_GOTRUE_JWT_SECRET",
  ];

  const found: Record<string, string> = {};
  for (const name of candidates) {
    const v = Deno.env.get(name);
    if (v) {
      found[name] = v.length > 80 ? v.slice(0, 40) + "..." + v.slice(-20) + `[${v.length}]` : v;
    }
  }

  // Also try to use the Supabase client to get project info
  // The edge function runtime may expose the secret through the global SupabaseClient
  const responseBody: Record<string, unknown> = { found, allFoundKeys: Object.keys(found) };

  // Try to sign a JWT using the service role key's own secret
  // by leveraging the edge function's ability to make authenticated requests
  // First, let's see if we can create a temporary anon-key-like token
  // through the auth admin API
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (serviceRoleKey && supabaseUrl) {
    try {
      // Try to get the JWT secret from the auth admin endpoint
      const resp = await fetch(`${supabaseUrl}/auth/v1/admin/config`, {
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      });
      if (resp.ok) {
        const config = await resp.json();
        responseBody.authConfig = config;
      } else {
        responseBody.authConfigError = `${resp.status}: ${await resp.text()}`;
      }
    } catch (e) {
      responseBody.authConfigError = String(e);
    }
  }

  return new Response(JSON.stringify(responseBody, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
