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

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const channel = supabase
        .channel('memories-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'memories',
          },
          () => {
            fetchMemories();
          }
        )
        .subscribe();

      return channel;
    };

    let channelPromise = setupRealtimeSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!query.trim()) {
        return { data: data || [], error: null };
      }

      const lowerQuery = query.toLowerCase();
      const filtered = (data || []).filter(memory => {
        const textMatch = memory.text?.toLowerCase().includes(lowerQuery);
        const summaryMatch = memory.summary?.toLowerCase().includes(lowerQuery);
        const tagMatch = memory.tags?.some((tag: string) =>
          tag.toLowerCase().includes(lowerQuery)
        );
        return textMatch || summaryMatch || tagMatch;
      });

      return { data: filtered, error: null };
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
      console.error('Error summarizing text, using fallback:', error);
      return fallbackSummarize(text, type);
    }
  };

  const fallbackSummarize = (text: string, type: 'summary' | 'tags' | 'followup' = 'summary') => {
    if (type === 'summary') {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const firstSentence = sentences[0]?.trim() || text;
      if (firstSentence.length > 150) {
        return firstSentence.substring(0, 147) + '...';
      }
      return firstSentence;
    }

    if (type === 'tags') {
      const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'about', 'as', 'is', 'was', 'are', 'were',
        'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      ]);

      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

      const wordFreq = new Map<string, number>();
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });

      return Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
    }

    return text;
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
