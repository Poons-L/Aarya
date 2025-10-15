import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Memory {
  id: string;
  user_id: string;
  text: string;
  summary: string | null;
  tags: string[];
  source_type: 'voice' | 'text' | 'ocr';
  linked_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const addMemory = async (memoryData: {
    text: string;
    summary?: string;
    tags?: string[];
    source_type: 'voice' | 'text' | 'ocr';
    linked_contact_id?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          text: memoryData.text,
          summary: memoryData.summary || null,
          tags: memoryData.tags || [],
          source_type: memoryData.source_type,
          linked_contact_id: memoryData.linked_contact_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setMemories(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding memory:', error);
      return { data: null, error: error.message };
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMemories(prev => prev.map(m => m.id === id ? data : m));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating memory:', error);
      return { data: null, error: error.message };
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMemories(prev => prev.filter(m => m.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting memory:', error);
      return { error: error.message };
    }
  };

  const searchMemories = async (query: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id)
        .or(`text.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error searching memories:', error);
      return { data: [], error: error.message };
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      const reader = new FileReader();
      const audioDataPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioData = await audioDataPromise;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ audioData }),
        }
      );

      if (!response.ok) throw new Error('Transcription failed');

      const result = await response.json();
      return result.transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  };

  const summarizeText = async (text: string, type: 'summary' | 'tags' | 'followup' = 'summary') => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-text`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, type }),
        }
      );

      if (!response.ok) throw new Error('Summarization failed');

      const result = await response.json();
      return type === 'tags' ? result.tags : result.result;
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  };

  return {
    memories,
    loading,
    addMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
    transcribeAudio,
    summarizeText,
    refreshMemories: fetchMemories,
  };
}
