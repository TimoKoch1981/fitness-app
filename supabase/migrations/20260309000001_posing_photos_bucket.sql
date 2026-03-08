-- ============================================================================
-- Migration: Posing/Progress Photos Storage Bucket
-- Creates storage bucket for user progress and posing photos with RLS policies.
-- Used by ProgressPhotosTimeline, PosingPhotos, and TrainingPage upload.
-- ============================================================================

-- 1. Create posing-photos storage bucket (public, 50MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posing-photos',
  'posing-photos',
  true,
  52428800,  -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies

-- All authenticated users can view photos (public bucket for getPublicUrl)
CREATE POLICY "Posing photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posing-photos');

-- Users can upload their own photos (folder = their user_id)
CREATE POLICY "Users can upload their own posing photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'posing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update (upsert) their own photos
CREATE POLICY "Users can update their own posing photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'posing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete their own posing photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'posing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
