import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_EMAIL = "poonam@uplifyt.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user.email !== OWNER_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all users
    const { data: allUsers, error: usersError } = await serviceClient.auth.admin.listUsers();
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const users = allUsers.users;
    const totalUsers = users.length;

    // Sign-up method breakdown
    const googleUsers = users.filter(u => {
      const providers = u.app_metadata?.providers || [];
      const provider = u.app_metadata?.provider;
      return providers.includes('google') || provider === 'google';
    });
    const emailUsers = users.filter(u => {
      const providers = u.app_metadata?.providers || [];
      const provider = u.app_metadata?.provider;
      return !providers.includes('google') && provider !== 'google';
    });

    // Activity metrics
    const activeUsers = users.filter(
      u => u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
    ).length;
    const inactiveUsers = users.filter(
      u => !u.last_sign_in_at || new Date(u.last_sign_in_at) < thirtyDaysAgo
    ).length;

    // Total contacts
    const { count: totalContacts } = await serviceClient
      .from("contacts")
      .select("*", { count: "exact", head: true });

    // Contacts per user
    const { data: userContactCounts } = await serviceClient
      .from("contacts")
      .select("user_id");

    const contactCountByUser: Record<string, number> = {};
    userContactCounts?.forEach((c) => {
      contactCountByUser[c.user_id] = (contactCountByUser[c.user_id] || 0) + 1;
    });

    // Interactions per user (count interaction_history entries per user)
    const { data: contactsWithHistory } = await serviceClient
      .from("contacts")
      .select("user_id, interaction_history");

    const interactionCountByUser: Record<string, number> = {};
    let totalInteractions = 0;
    contactsWithHistory?.forEach((c) => {
      const count = Array.isArray(c.interaction_history) ? c.interaction_history.length : 0;
      interactionCountByUser[c.user_id] = (interactionCountByUser[c.user_id] || 0) + count;
      totalInteractions += count;
    });

    // Build per-user data
    const usersWithStats = users.map((u) => {
      const providers = u.app_metadata?.providers || [];
      const provider = u.app_metadata?.provider;
      const isGoogle = providers.includes('google') || provider === 'google';

      return {
        id: u.id,
        email: u.email || '',
        signup_method: isGoogle ? 'Google' : 'Email',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        contact_count: contactCountByUser[u.id] || 0,
        interaction_count: interactionCountByUser[u.id] || 0,
      };
    });

    const stats = {
      summary: {
        totalUsers,
        totalContacts: totalContacts || 0,
        totalInteractions,
        activeUsers,
        inactiveUsers,
      },
      sourceBreakdown: {
        google: { count: googleUsers.length, percentage: totalUsers > 0 ? Math.round((googleUsers.length / totalUsers) * 100) : 0 },
        email: { count: emailUsers.length, percentage: totalUsers > 0 ? Math.round((emailUsers.length / totalUsers) * 100) : 0 },
      },
      users: usersWithStats,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch admin statistics" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
