-- Phase 5: View Tracking + Leaderboard
-- Run in Supabase SQL Editor

-- Ensure metrics table has all needed columns
-- (If it already exists from phase 4, this just adds missing pieces)

CREATE TABLE IF NOT EXISTS metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  view_count  bigint NOT NULL DEFAULT 0,
  like_count  bigint NOT NULL DEFAULT 0,
  comment_count bigint NOT NULL DEFAULT 0,
  share_count bigint NOT NULL DEFAULT 0,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast leaderboard queries
CREATE INDEX IF NOT EXISTS metrics_entry_id_idx       ON metrics(entry_id);
CREATE INDEX IF NOT EXISTS metrics_entry_fetched_idx  ON metrics(entry_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS metrics_fetched_at_idx     ON metrics(fetched_at DESC);

-- RLS
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can read metrics (leaderboard is public)
DROP POLICY IF EXISTS "metrics_select_public" ON metrics;
CREATE POLICY "metrics_select_public"
  ON metrics FOR SELECT
  USING (true);

-- Only service role can insert (cron job uses service role key)
DROP POLICY IF EXISTS "metrics_insert_service" ON metrics;
CREATE POLICY "metrics_insert_service"
  ON metrics FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup: keep only last 48 hours of metrics to avoid table bloat
-- (Run manually or set up a scheduled Supabase job)
-- DELETE FROM metrics WHERE fetched_at < now() - interval '48 hours';

-- Helper view: latest metric per entry
CREATE OR REPLACE VIEW latest_metrics AS
SELECT DISTINCT ON (entry_id)
  entry_id,
  view_count,
  like_count,
  comment_count,
  share_count,
  fetched_at
FROM metrics
ORDER BY entry_id, fetched_at DESC;
