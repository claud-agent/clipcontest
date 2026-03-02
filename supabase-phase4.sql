-- ============================================
-- ClipContest Phase 4 - Entry Validation
-- Run this in Supabase SQL Editor
-- ============================================

-- Unique constraint: 1 entry per user per contest
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS video_title TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS is_owner_confirmed BOOLEAN DEFAULT false;

-- Prevent duplicate entries
ALTER TABLE entries
  DROP CONSTRAINT IF EXISTS unique_entry_per_user_contest;
ALTER TABLE entries
  ADD CONSTRAINT unique_entry_per_user_contest UNIQUE (contest_id, user_id);
