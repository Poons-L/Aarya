import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LinkedInResponse {
  firstName?: string;
  lastName?: string;
  headline?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  summary?: string;
  profilePicture?: string;
  [key: string]: any;
}

interface ContactData {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  notes?: string;
  photo_url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { linkedin_url } = await req.json();

    if (!linkedin_url) {
      return new Response(
        JSON.stringify({ error: "LinkedIn URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!rapidApiKey) {
      return new Response(
        JSON.stringify({ error: "RapidAPI key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiUrl = `https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile?linkedin_url=${encodeURIComponent(linkedin_url)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "fresh-linkedin-profile-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch LinkedIn profile data" }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const linkedInData: LinkedInResponse = await response.json();

    const contactData: ContactData = {
      first_name: linkedInData.firstName || undefined,
      last_name: linkedInData.lastName || undefined,
      job_title: linkedInData.headline || undefined,
      company: linkedInData.company || undefined,
      location: linkedInData.location || undefined,
      email: linkedInData.email || undefined,
      phone: linkedInData.phone || undefined,
      notes: linkedInData.summary || undefined,
      photo_url: linkedInData.profilePicture || undefined,
    };

    return new Response(
      JSON.stringify({ success: true, data: contactData }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in linkedin-autofill function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
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
