-- ============================================
-- ClipContest Phase 3 - Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS update_frequency TEXT DEFAULT 'daily'
    CHECK (update_frequency IN ('hourly', 'every6hours', 'daily')),
  ADD COLUMN IF NOT EXISTS participation_hashtag TEXT,
  ADD COLUMN IF NOT EXISTS participation_tag TEXT,
  ADD COLUMN IF NOT EXISTS max_entries_per_person INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS winner_logic TEXT DEFAULT 'hybrid'
    CHECK (winner_logic IN ('jury', 'views', 'hybrid')),
  ADD COLUMN IF NOT EXISTS winner_count INTEGER DEFAULT 1
    CHECK (winner_count BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS prize_split JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS terms TEXT,
  ADD COLUMN IF NOT EXISTS anti_manipulation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
