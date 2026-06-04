import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface TalkingPointItem {
  text: string;
  source_labels: string[];
}

export interface TalkingPointsOutput {
  personalized_opener: string;
  talking_points: TalkingPointItem[];
  follow_up_questions: TalkingPointItem[];
  watchouts: string[];
  confidence: 'low' | 'medium' | 'high';
}

export interface SourceSummary {
  sources_used: string[];
  source_count: number;
  contact_record: boolean;
  linkedin: boolean;
  meeting_notes: boolean;
  interaction_history: boolean;
}

export interface TalkingPointsResult {
  output: TalkingPointsOutput | null;
  source_summary: SourceSummary | null;
  cached: boolean;
  empty_state: boolean;
  message?: string;
  dailyUsed?: number;
  dailyLimit?: number | null;
  monthlyUsed?: number;
  monthlyLimit?: number | null;
}

export function useTalkingPoints() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TalkingPointsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (contactId: string, userContext?: string, forceRefresh = false) => {
    if (!session?.access_token) {
      setError('Please sign in to use this feature.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-talking-points`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: contactId,
          user_context: userContext?.trim() || null,
          force_refresh: forceRefresh,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setError(data.message || 'Rate limit reached.');
        setResult({
          output: null,
          source_summary: null,
          cached: false,
          empty_state: false,
          dailyUsed: data.dailyUsed,
          dailyLimit: data.dailyLimit,
          monthlyUsed: data.monthlyUsed,
          monthlyLimit: data.monthlyLimit,
        });
        return;
      }

      if (response.status === 404) {
        setError('Contact not found.');
        return;
      }

      if (!response.ok && response.status !== 200) {
        setError(data.error || 'Failed to generate talking points.');
        return;
      }

      if (data.empty_state) {
        setResult({
          output: null,
          source_summary: data.source_summary,
          cached: false,
          empty_state: true,
          message: data.message,
        });
        return;
      }

      setResult({
        output: data.output,
        source_summary: data.source_summary,
        cached: data.cached || false,
        empty_state: false,
        dailyUsed: data.dailyUsed,
        dailyLimit: data.dailyLimit,
        monthlyUsed: data.monthlyUsed,
        monthlyLimit: data.monthlyLimit,
      });
    } catch (err: any) {
      setError(err.message || 'Error connecting to service.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const enrichContact = useCallback(async (contactId: string) => {
    if (!session?.access_token) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-contact`;

      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact_id: contactId }),
      });
    } catch {
      // Enrichment is fire-and-forget
    }
  }, [session]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, result, error, generate, enrichContact, reset };
}
