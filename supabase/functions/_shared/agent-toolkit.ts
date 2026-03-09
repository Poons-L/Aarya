import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Contact {
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
}

export interface Interaction {
  id: string;
  contact_id: string;
  date: string;
  note: string;
  type?: string;
  created_at: string;
}

export interface ContextSource {
  type: 'interaction_history' | 'notes' | 'linkedin' | 'fallback';
}

export async function getContact(contactId: string, userId?: string): Promise<Contact | null> {
  console.log('🔍 [Toolkit] getContact called with:', { contactId, userId });

  const query = supabaseAdmin
    .from("contacts")
    .select("id, name, company, title, email, phone, linkedin_url, interests, notes, tags, relationship, last_contacted")
    .eq("id", contactId);

  // Filter by user_id if provided to respect data ownership
  if (userId) {
    query.eq("user_id", userId);
  }

  const { data, error, count } = await query.maybeSingle();

  if (error) {
    console.error("❌ [Toolkit] Error fetching contact:", {
      contactId,
      userId,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  if (!data) {
    console.warn("⚠️ [Toolkit] No contact data returned for:", {
      contactId,
      userId,
      message: "Contact not found or user does not have access"
    });
    return null;
  }

  console.log('✅ [Toolkit] Contact fetched successfully:', {
    id: data.id,
    name: data.name
  });

  return data;
}

export async function getRecentInteractions(
  contactId: string,
  limit: number = 3
): Promise<Interaction[]> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, contact_id, date, note, type, created_at")
    .eq("contact_id", contactId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching interactions:", error);
    return [];
  }

  return data || [];
}

export async function getNotes(contactId: string): Promise<string | null> {
  const contact = await getContact(contactId);
  return contact?.notes || null;
}

export interface ConversationStartersResponse {
  starters: string[];
  context_source: 'interaction_history' | 'notes' | 'linkedin' | 'fallback';
  cached?: boolean;
  generatedAt?: string;
  daysAgo?: number;
}

export async function generateConversationStarters({
  contactId,
  authToken,
  forceRefresh,
  contactData,
  userContextNote,
}: {
  contactId: string;
  authToken: string;
  forceRefresh?: boolean;
  contactData?: Contact;
  userContextNote?: string | null;
}): Promise<ConversationStartersResponse> {
  // Use provided contact data or fetch from DB
  const contact = contactData || await getContact(contactId);
  if (!contact) {
    throw new Error("Contact not found");
  }

  const interactions = await getRecentInteractions(contactId, 3);

  // Log the context data being sent for verification
  console.log('📤 [Toolkit] Sending to generate-conversation-starters:', {
    contactId,
    name: contact.name,
    hasNotes: !!contact.notes,
    notesLength: contact.notes?.length || 0,
    notesPreview: contact.notes ? contact.notes.substring(0, 100) : null,
    hasInteractionHistory: interactions.length > 0,
    interactionCount: interactions.length,
    hasLinkedIn: !!contact.linkedin_url,
    hasUserContextNote: !!userContextNote,
    userContextNotePreview: userContextNote ? userContextNote.substring(0, 50) : null,
    forceRefresh: !!forceRefresh,
  });

  const response = await fetch(
    `${supabaseUrl}/functions/v1/generate-conversation-starters`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contactId,
        name: contact.name,
        title: contact.title,
        company: contact.company,
        linkedin_url: contact.linkedin_url,
        interests: contact.interests,
        notes: contact.notes,
        relationship: contact.relationship,
        tags: contact.tags,
        last_contacted: contact.last_contacted,
        interaction_history: interactions,
        user_context_note: userContextNote,
        forceRefresh: !!forceRefresh,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate conversation starters");
  }

  const data = await response.json();

  console.log('📥 [Toolkit] Received from generate-conversation-starters:', {
    context_source: data.context_source,
    starterCount: data.starters?.length || 0,
    cached: data.cached,
  });

  return {
    starters: data.starters || [],
    context_source: data.context_source || 'fallback',
    cached: data.cached,
    generatedAt: data.generatedAt,
    daysAgo: data.daysAgo,
  };
}

export async function createInteraction(
  contactId: string,
  content: string,
  type: string = "note",
  timestamp?: string
): Promise<Interaction | null> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      contact_id: contactId,
      note: content,
      type,
      date: timestamp || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating interaction:", error);
    return null;
  }

  return data;
}
