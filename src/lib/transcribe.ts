import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) resolve(base64);
      else reject(new Error('Failed to read the recording'));
    };
    reader.onerror = () => reject(new Error('Failed to read the recording'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends a recording to the transcribe-audio edge function (as the signed-in user)
 * and returns the transcript. Throws an Error whose message is safe to show the user,
 * including the server's limit messages (e.g. daily limit reached, recording too long).
 */
export async function transcribeAudio(blob: Blob, language = 'en'): Promise<string> {
  const audioData = await blobToBase64(blob);
  const { data, error } = await supabase.functions.invoke('transcribe-audio', {
    body: { audioData, language },
  });

  if (error) {
    let message = 'Transcription failed. Please try again or type instead.';
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (body?.message || body?.error) message = body.message || body.error;
    }
    throw new Error(message);
  }

  return (data?.transcript ?? '').trim();
}
