-- ============================================
-- ClipContest — 10-Point Scoring System
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add score columns to entries
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS base_score      NUMERIC(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_score     NUMERIC(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flag_count      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS under_review    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- 2. video_flags table — one row per computation run, stores which flags fired
CREATE TABLE IF NOT EXISTS video_flags (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id       UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  computed_at    TIMESTAMPTZ DEFAULT NOW(),
  spike_ratio    BOOLEAN DEFAULT FALSE,
  decoupling     BOOLEAN DEFAULT FALSE,
  rate_jump      BOOLEAN DEFAULT FALSE,
  flag_count     INTEGER DEFAULT 0,
  penalty        INTEGER DEFAULT 0,
  snapshots_used INTEGER DEFAULT 0,
  details        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS video_flags_entry_id_idx ON video_flags(entry_id);
CREATE INDEX IF NOT EXISTS video_flags_computed_at_idx ON video_flags(computed_at DESC);

-- 3. RLS for video_flags
ALTER TABLE video_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flags readable by everyone" ON video_flags FOR SELECT USING (true);
CREATE POLICY "Service role can insert flags" ON video_flags FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update flags" ON video_flags FOR UPDATE USING (true);

-- 4. Index on metrics for fast snapshot retrieval
CREATE INDEX IF NOT EXISTS metrics_entry_fetched_idx ON metrics(entry_id, fetched_at DESC);
