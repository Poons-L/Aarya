/*
  # Create Storage Buckets for Re.Me

  ## Overview
  Creates storage buckets for contact photos and audio recordings with proper RLS policies.

  ## Storage Buckets

  ### contact-photos
  - Public read access for convenience
  - Only authenticated users can upload
  - Users can only update/delete their own photos

  ### audio-recordings
  - Private access
  - Only authenticated users can upload
  - Users can only access their own recordings

  ## Security
  - RLS enabled on all buckets
  - Users can only manage their own files
  - Files are organized by user_id
*/

-- Create contact-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-photos', 'contact-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create audio-recordings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contact-photos
CREATE POLICY "Users can upload own contact photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contact-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view contact photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'contact-photos');

CREATE POLICY "Users can update own contact photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contact-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own contact photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contact-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for audio-recordings
CREATE POLICY "Users can upload own audio recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own audio recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own audio recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own audio recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
