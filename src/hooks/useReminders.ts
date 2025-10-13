import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Reminder {
  id: string;
  user_id: string;
  contact_id?: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  contact?: {
    name: string;
    company?: string;
  };
}

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('reminders')
        .select(`
          *,
          contact:contacts(name, company)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;

      setReminders(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const addReminder = async (reminderData: {
    contact_id?: string;
    title: string;
    description?: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([
          {
            user_id: user.id,
            ...reminderData,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchReminders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchReminders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    return updateReminder(id, {
      completed,
      completed_at: completed ? new Date().toISOString() : undefined,
    });
  };

  const deleteReminder = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchReminders();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    reminders,
    loading,
    error,
    addReminder,
    updateReminder,
    toggleComplete,
    deleteReminder,
    refetch: fetchReminders,
  };
}
