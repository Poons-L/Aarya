import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Event {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  event_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  speaker?: string;
  start_time: string;
  end_time: string;
  location?: string;
  room?: string;
  track?: string;
  tags?: string[];
  access_level?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionNote {
  id: string;
  session_id: string;
  user_id: string;
  raw_text: string;
  summary?: string;
  tags?: string[];
  source: 'voice' | 'text' | 'ocr';
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  session_id?: string;
  title: string;
  attendees: string[];
  start_time: string;
  end_time: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchSessions();
    fetchSessionNotes();
    fetchMeetings();

    const eventsChannel = supabase
      .channel('events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchSessions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_notes' }, fetchSessionNotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, fetchMeetings)
      .subscribe();

    return () => {
      eventsChannel.unsubscribe();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSessionNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionNotes(data || []);
    } catch (error) {
      console.error('Error fetching session notes:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const createEvent = async (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert([{ ...event, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating event:', error);
      return { data: null, error };
    }
  };

  const createSession = async (session: Omit<Session, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([session])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating session:', error);
      return { data: null, error };
    }
  };

  const createSessionNote = async (note: Omit<SessionNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('session_notes')
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating session note:', error);
      return { data: null, error };
    }
  };

  const createMeeting = async (meeting: Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meetings')
        .insert([{ ...meeting, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating meeting:', error);
      return { data: null, error };
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating event:', error);
      return { data: null, error };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { error };
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting session:', error);
      return { error };
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return { error };
    }
  };

  const getSessionsForEvent = (eventId: string) => {
    return sessions.filter(s => s.event_id === eventId);
  };

  const getNotesForSession = (sessionId: string) => {
    return sessionNotes.filter(n => n.session_id === sessionId);
  };

  const getMeetingsForSession = (sessionId: string) => {
    return meetings.filter(m => m.session_id === sessionId);
  };

  const importFromCSV = async (csvData: string) => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      if (lines.length > 1001) {
        throw new Error('CSV file is too large (max 1,000 rows)');
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredHeaders = ['event_title', 'session_title', 'session_start', 'session_end'];

      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          throw new Error(`Missing required column: ${required}`);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const eventMap = new Map<string, string>();
      let importedSessions = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (!row.event_title || !row.session_title) continue;

        let eventId = eventMap.get(row.event_title);

        if (!eventId) {
          const eventData = {
            name: row.event_title,
            location: row.event_location || '',
            start_date: row.event_start || row.session_start,
            end_date: row.event_end || row.session_end,
            description: ''
          };

          const { data: event } = await createEvent(eventData);
          if (event && event.id) {
            eventId = event.id;
            eventMap.set(row.event_title, eventId);
          }
        }

        if (eventId) {
          const sessionData = {
            event_id: eventId,
            title: row.session_title,
            speaker: row.session_speaker || '',
            room: row.session_room || '',
            start_time: row.session_start,
            end_time: row.session_end,
            tags: row.session_tags ? row.session_tags.split(';').map(t => t.trim()) : [],
            description: ''
          };

          const { data } = await createSession(sessionData);
          if (data) importedSessions++;
        }
      }

      return { success: true, count: importedSessions };
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    events,
    sessions,
    sessionNotes,
    meetings,
    loading,
    createEvent,
    createSession,
    createSessionNote,
    createMeeting,
    updateEvent,
    deleteEvent,
    deleteSession,
    deleteMeeting,
    getSessionsForEvent,
    getNotesForSession,
    getMeetingsForSession,
    importFromCSV,
  };
}
