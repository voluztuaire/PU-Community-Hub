-- Migration: Study Group Privacy, Requests, and Storage Buckets

-- 1. Add is_private and major_id to study_groups
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS major_id UUID REFERENCES majors(id) ON DELETE SET NULL;

-- 2. Create study_group_requests table for private groups
CREATE TABLE IF NOT EXISTS study_group_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. Create Storage Buckets for Avatars and Chat Attachments
-- (Note: Storage buckets require the 'storage' schema in Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for Avatars bucket (public read, authenticated users can insert/update)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Policies for Chat Attachments bucket (public read, authenticated insert)
CREATE POLICY "Public Access Attachments" ON storage.objects FOR SELECT USING (bucket_id = 'chat_attachments');
CREATE POLICY "Auth Insert Attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat_attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Attachments" ON storage.objects FOR DELETE USING (bucket_id = 'chat_attachments' AND auth.role() = 'authenticated');
