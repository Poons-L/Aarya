import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  conversation_date: string;
  transcript?: string;
  summary?: string;
  audio_url?: string;
  created_at: string;
  updated_at: string;
  key_points?: string[];
}

export function useConversations(contactId?: string) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('conversation_date', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data: conversationsData, error: conversationsError } = await query;

      if (conversationsError) throw conversationsError;

      const conversationsWithKeyPoints = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          const { data: keyPointsData } = await supabase
            .from('conversation_key_points')
            .select('key_point')
            .eq('conversation_id', conversation.id);

          return {
            ...conversation,
            key_points: keyPointsData?.map((kp) => kp.key_point) || [],
          };
        })
      );

      setConversations(conversationsWithKeyPoints);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user, contactId]);

  const addConversation = async (conversationData: {
    contact_id: string;
    transcript?: string;
    summary?: string;
    audio_url?: string;
    key_points?: string[];
  }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { key_points, ...conversationInsert } = conversationData;

      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: user.id,
            ...conversationInsert,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data && key_points && key_points.length > 0) {
        const keyPointInserts = key_points.map((kp) => ({
          conversation_id: data.id,
          key_point: kp,
        }));

        await supabase.from('conversation_key_points').insert(keyPointInserts);
      }

      await fetchConversations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateConversation = async (
    id: string,
    updates: Partial<Conversation> & { key_points?: string[] }
  ) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { key_points, ...conversationUpdates } = updates;

      const { data, error } = await supabase
        .from('conversations')
        .update(conversationUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (key_points !== undefined) {
        await supabase
          .from('conversation_key_points')
          .delete()
          .eq('conversation_id', id);

        if (key_points.length > 0) {
          const keyPointInserts = key_points.map((kp) => ({
            conversation_id: id,
            key_point: kp,
          }));
          await supabase.from('conversation_key_points').insert(keyPointInserts);
        }
      }

      await fetchConversations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchConversations();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const uploadAudio = async (file: File) => {
    if (!user) return { error: 'Not authenticated', url: null };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message };
    }
  };

  return {
    conversations,
    loading,
    error,
    addConversation,
    updateConversation,
    deleteConversation,
    uploadAudio,
    refetch: fetchConversations,
  };
}
