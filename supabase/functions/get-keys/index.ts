const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const keys = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_JWKS",
  ];

  const result: Record<string, string> = {};
  for (const key of keys) {
    const val = Deno.env.get(key);
    if (val) {
      result[key] = val.length > 500 ? val.substring(0, 500) + `...[${val.length} total]` : val;
    } else {
      result[key] = "(not set)";
    }
  }

  return new Response(
    JSON.stringify(result, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
