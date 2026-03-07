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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (user.email !== OWNER_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: allUsers, error: usersError } = await serviceClient.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const totalUsers = allUsers.users.length;
    const newUsersThisWeek = allUsers.users.filter(
      (u) => new Date(u.created_at) > oneWeekAgo
    ).length;
    const activeUsers = allUsers.users.filter(
      (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) > oneWeekAgo
    ).length;

    const { count: totalContacts } = await serviceClient
      .from("contacts")
      .select("*", { count: "exact", head: true });

    const { count: newContactsThisWeek } = await serviceClient
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString());

    const { count: totalAIUsage } = await serviceClient
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true });

    const { data: userContactCounts } = await serviceClient
      .from("contacts")
      .select("user_id");

    const contactCountByUser: Record<string, number> = {};
    userContactCounts?.forEach((c) => {
      contactCountByUser[c.user_id] = (contactCountByUser[c.user_id] || 0) + 1;
    });

    const usersWithStats = allUsers.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      contact_count: contactCountByUser[u.id] || 0,
    }));

    const { data: dailySignups } = await serviceClient.rpc(
      "get_daily_signups",
      { days: 30 }
    ).then((result) => {
      if (result.error) {
        const dailyCounts: Record<string, number> = {};
        allUsers.users.forEach((u) => {
          const date = new Date(u.created_at).toISOString().split("T")[0];
          if (new Date(u.created_at) > thirtyDaysAgo) {
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
          }
        });
        return { data: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })) };
      }
      return result;
    });

    const { data: contactsData } = await serviceClient
      .from("contacts")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const dailyContactCounts: Record<string, number> = {};
    contactsData?.forEach((c) => {
      const date = new Date(c.created_at).toISOString().split("T")[0];
      dailyContactCounts[date] = (dailyContactCounts[date] || 0) + 1;
    });

    const contactsOverTime = Object.entries(dailyContactCounts).map(([date, count]) => ({
      date,
      count,
    }));

    const { data: recentContacts } = await serviceClient
      .from("contacts")
      .select("id, name, email, company, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(10);

    const stats = {
      metrics: {
        totalUsers,
        totalContacts: totalContacts || 0,
        totalAIUsage: totalAIUsage || 0,
        newUsersThisWeek,
        newContactsThisWeek: newContactsThisWeek || 0,
        activeUsers,
      },
      users: usersWithStats,
      charts: {
        signupsOverTime: dailySignups || [],
        contactsOverTime,
      },
      recentActivity: {
        recentContacts: recentContacts || [],
        recentSignups: allUsers.users
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map((u) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
          })),
      },
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch admin statistics",
      }),
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
