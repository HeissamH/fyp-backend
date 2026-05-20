-- Migration: Add parent_id to comments table for threaded replies
-- Run via: npx drizzle-kit push  OR  apply manually on Supabase SQL editor

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Index to speed up fetching all replies for a given comment
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Index to speed up fetching all comments for a given target
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_id, target_type);
