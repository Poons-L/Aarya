import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Calls a Supabase edge function as the signed-in user.
 * Throws an Error whose message is safe to show the user, including the server's
 * own messages (daily limit reached, input too large, etc.).
 */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>, fallbackMessage: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = fallbackMessage;
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      if (error.context.status === 401) message = 'Your session has expired. Please sign in again.';
      else if (payload?.message || payload?.error) message = payload.message || payload.error;
    }
    throw new Error(message);
  }

  return data as T;
}
