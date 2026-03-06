import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  linkedin_url?: string;
  met_at?: string;
  met_date: string;
  notes?: string;
  last_contact?: string;
  interaction_history?: any[];
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      const contactsWithTags = await Promise.all(
        (contactsData || []).map(async (contact) => {
          const { data: tagsData } = await supabase
            .from('contact_tags')
            .select('tag')
            .eq('contact_id', contact.id);

          return {
            ...contact,
            tags: tagsData?.map((t) => t.tag) || [],
          };
        })
      );

      setContacts(contactsWithTags);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const addContact = async (contactData: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'tags'> & { tags?: string[] }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: user.id,
            name: contactData.name,
            company: contactData.company,
            title: contactData.title,
            email: contactData.email,
            phone: contactData.phone,
            photo_url: contactData.photo_url,
            linkedin_url: contactData.linkedin_url,
            met_at: contactData.met_at,
            met_date: contactData.met_date,
            notes: contactData.notes,
            interaction_history: contactData.interaction_history || [],
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data && contactData.tags && contactData.tags.length > 0) {
        const tagInserts = contactData.tags.map((tag) => ({
          contact_id: data.id,
          tag: tag.trim(),
        }));

        await supabase.from('contact_tags').insert(tagInserts);
      }

      await fetchContacts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateContact = async (id: string, contactData: Partial<Contact> & { tags?: string[] }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { tags, ...updateData } = contactData;

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (tags !== undefined) {
        await supabase.from('contact_tags').delete().eq('contact_id', id);

        if (tags.length > 0) {
          const tagInserts = tags.map((tag) => ({
            contact_id: id,
            tag: tag.trim(),
          }));
          await supabase.from('contact_tags').insert(tagInserts);
        }
      }

      await fetchContacts();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteContact = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchContacts();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const uploadPhoto = async (file: File, contactId?: string) => {
    if (!user) return { error: 'Not authenticated', url: null };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${contactId || Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contact-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contact-photos')
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message };
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    uploadPhoto,
    refetch: fetchContacts,
  };
}
