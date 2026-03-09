import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  getContact,
  getRecentInteractions,
  getNotes,
  generateConversationStarters,
} from "../_shared/agent-toolkit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MeetingPrepRequest {
  contact_id: string;
  contact?: any; // Optional full contact object as fallback
  meeting?: {
    title?: string | null;
    datetime?: string | null;
    channel?: "in_person" | "zoom" | "teams" | "phone" | "other" | null;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: MeetingPrepRequest = await req.json();

    console.log('🔍 [Meeting Prep] Request received:', {
      contact_id: requestData.contact_id,
      user_id: user.id,
      meeting: requestData.meeting
    });

    if (!requestData.contact_id) {
      console.error('❌ [Meeting Prep] Missing contact_id in request');
      return new Response(
        JSON.stringify({ error: "Missing contact_id in request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof requestData.contact_id !== 'string' || requestData.contact_id.trim() === '') {
      console.error('❌ [Meeting Prep] Invalid contact_id:', requestData.contact_id);
      return new Response(
        JSON.stringify({ error: "Invalid contact_id format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to get contact from database first, filtering by user_id
    console.log('🔎 [Meeting Prep] Fetching contact from database:', requestData.contact_id);
    let contact = await getContact(requestData.contact_id, user.id);

    // If contact not found in DB but client provided full contact object, use it as fallback
    if (!contact && requestData.contact) {
      console.log('⚠️ [Meeting Prep] Contact not found in DB, using client-provided contact object');
      contact = requestData.contact;
    }

    if (!contact) {
      console.error('❌ [Meeting Prep] Contact not found in DB or request:', {
        contact_id: requestData.contact_id,
        user_id: user.id,
        had_client_contact: !!requestData.contact
      });
      return new Response(
        JSON.stringify({
          error: `No contact found with id: ${requestData.contact_id}`,
          contact_id: requestData.contact_id
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('✅ [Meeting Prep] Contact resolved:', {
      id: contact.id,
      name: contact.name,
      source: requestData.contact ? 'client-fallback' : 'database'
    });

    const interactions = await getRecentInteractions(requestData.contact_id, 3);
    const notes = await getNotes(requestData.contact_id);

    let startersResponse;
    try {
      startersResponse = await generateConversationStarters({
        contactId: requestData.contact_id,
        authToken: authHeader,
        forceRefresh: false,
        contactData: contact,
        userContextNote: null,
      });
    } catch (error) {
      console.error("Error generating starters:", error);
      startersResponse = {
        starters: [
          "Looking forward to connecting with you",
          "Let's catch up on what you've been working on",
          "Excited to hear your thoughts",
        ],
        context_source: 'fallback' as const,
      };
    }

    const briefingSummary = generateBriefingSummary(
      contact,
      interactions,
      notes,
      startersResponse.context_source
    );

    const allStarters = [
      ...startersResponse.starters.slice(0, 3),
      "Tell me if you have anything specific you'd like to discuss",
    ];

    const meetingMetadata = {
      title: requestData.meeting?.title || contact.name,
      datetime: requestData.meeting?.datetime || new Date().toISOString(),
      channel: requestData.meeting?.channel || null,
    };

    return new Response(
      JSON.stringify({
        briefing_summary: briefingSummary,
        starters: allStarters,
        context_source: startersResponse.context_source,
        meeting_metadata: meetingMetadata,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in meeting-prep-agent:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to prepare meeting briefing",
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

function generateBriefingSummary(
  contact: any,
  interactions: any[],
  notes: string | null,
  contextSource: string
): string {
  const parts: string[] = [];

  parts.push(`You're meeting with ${contact.name}`);

  if (contact.title && contact.company) {
    parts.push(`who is ${contact.title} at ${contact.company}`);
  } else if (contact.title) {
    parts.push(`who works as ${contact.title}`);
  } else if (contact.company) {
    parts.push(`who works at ${contact.company}`);
  }

  if (contact.relationship) {
    parts.push(`You know them as: ${contact.relationship}`);
  }

  if (interactions && interactions.length > 0) {
    const lastInteraction = interactions[0];
    const daysAgo = Math.floor(
      (new Date().getTime() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeRef = daysAgo === 0 ? "today" :
                   daysAgo === 1 ? "yesterday" :
                   daysAgo < 7 ? `${daysAgo} days ago` :
                   daysAgo < 30 ? `${Math.floor(daysAgo / 7)} weeks ago` :
                   `${Math.floor(daysAgo / 30)} months ago`;

    parts.push(`Last interaction was ${timeRef}: ${lastInteraction.note}`);
  } else if (notes && notes.trim().length > 0) {
    const notesPreview = notes.length > 100 ? notes.substring(0, 100) + "..." : notes;
    parts.push(`Notes: ${notesPreview}`);
  } else if (contact.linkedin_url) {
    parts.push(`Check their LinkedIn profile for recent updates`);
  }

  return parts.join(". ") + ".";
}
