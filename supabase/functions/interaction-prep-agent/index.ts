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

type ContextType = "meeting" | "call" | "message" | "generic_checkin";
type ChannelType = "in_person" | "zoom" | "teams" | "phone" | "whatsapp" | "linkedin" | "email" | "other" | null;

interface InteractionPrepRequest {
  contact_id: string;
  contact: {
    id: string;
    name: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    interests?: string[];
    notes?: string;
    tags?: string[];
    relationship?: string;
    last_contacted?: string;
  };
  context?: {
    context_type?: ContextType;
    title?: string | null;
    datetime?: string | null;
    channel?: ChannelType;
  };
  user_context_note?: string;
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

    const requestData: InteractionPrepRequest = await req.json();

    console.log('🔍 [Interaction Prep] Request received:', {
      contact_id: requestData.contact_id,
      contact_name: requestData.contact?.name,
      user_id: user.id,
      context: requestData.context,
      hasUserContextNote: !!requestData.user_context_note,
      userContextNotePreview: requestData.user_context_note ? requestData.user_context_note.substring(0, 50) : null
    });

    if (!requestData.contact_id || !requestData.contact) {
      console.error('❌ [Interaction Prep] Missing contact_id or contact data in request');
      return new Response(
        JSON.stringify({ error: "Missing contact_id or contact data in request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to fetch contact from database to get latest notes
    const contactFromDb = await getContact(requestData.contact_id, user.id);

    // Fallback pattern: Use DB if available, otherwise use UI contact
    const contact = contactFromDb
      ? { ...requestData.contact, ...contactFromDb }
      : requestData.contact;

    console.log('✅ [Interaction Prep] Contact lookup:', {
      id: contact.id,
      name: contact.name,
      source: contactFromDb ? 'database' : 'UI_fallback',
      hasNotes: !!contact.notes,
      notesLength: contact.notes?.length || 0,
      notesPreview: contact.notes ? contact.notes.substring(0, 100) : 'NO NOTES',
      hasLinkedIn: !!contact.linkedin_url,
    });

    const interactions = await getRecentInteractions(requestData.contact_id, 3);
    const notes = await getNotes(requestData.contact_id);

    let startersResponse;
    try {
      // Pass the contact data and user_context_note to AI
      startersResponse = await generateConversationStarters(
        requestData.contact_id,
        authHeader,
        false,
        contact,
        requestData.user_context_note
      );
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

    const contextType = requestData.context?.context_type || "generic_checkin";
    const briefingSummary = generateBriefingSummary(
      contact,
      interactions,
      notes,
      startersResponse.context_source,
      contextType
    );

    const allStarters = [
      ...startersResponse.starters.slice(0, 3),
      "Tell me if you have anything specific you'd like to discuss",
    ];

    const interactionContext = {
      context_type: contextType,
      title: requestData.context?.title || contact.name,
      datetime: requestData.context?.datetime || new Date().toISOString(),
      channel: requestData.context?.channel || null,
    };

    return new Response(
      JSON.stringify({
        briefing_summary: briefingSummary,
        starters: allStarters,
        context_source: startersResponse.context_source,
        interaction_context: interactionContext,
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
    console.error("Error in interaction-prep-agent:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to prepare interaction briefing",
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
  contextSource: string,
  contextType: string
): string {
  const parts: string[] = [];

  const contextTypeLabel = contextType === "meeting" ? "meeting with" :
                          contextType === "call" ? "calling" :
                          contextType === "message" ? "messaging" :
                          "connecting with";

  parts.push(`You're ${contextTypeLabel} ${contact.name}`);

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

    const interactionType = lastInteraction.type ? ` (${lastInteraction.type})` : "";
    parts.push(`Last interaction was ${timeRef}${interactionType}: ${lastInteraction.note}`);

    if (interactions.length > 1) {
      parts.push(`You've had ${interactions.length} recent interactions`);
    }
  } else if (notes && notes.trim().length > 0) {
    const notesPreview = notes.length > 100 ? notes.substring(0, 100) + "..." : notes;
    parts.push(`Notes: ${notesPreview}`);
  } else if (contact.linkedin_url) {
    parts.push(`Check their LinkedIn profile for recent updates`);
  } else {
    parts.push(`This will be a great chance to reconnect`);
  }

  return parts.join(". ") + ".";
}
