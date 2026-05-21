-- Migration: Add media_id to comments table for image attachments
-- Run via: npx drizzle-kit push  OR  apply manually on Supabase SQL editor

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES media(id);

-- Index to speed up fetching comments with their media
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);
