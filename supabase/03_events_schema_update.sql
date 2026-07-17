-- Add missing columns to the events table for the new event features
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS organizer_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_contact TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'webinar',
ADD COLUMN IF NOT EXISTS location_or_link TEXT;
