import { invokeFunction } from './functions';

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
 * and returns the transcript. Throws an Error whose message is safe to show the user.
 */
export async function transcribeAudio(blob: Blob, language = 'en'): Promise<string> {
  const audioData = await blobToBase64(blob);
  const data = await invokeFunction<{ transcript?: string }>(
    'transcribe-audio',
    { audioData, language },
    'Transcription failed. Please try again or type instead.',
  );
  return (data?.transcript ?? '').trim();
}
