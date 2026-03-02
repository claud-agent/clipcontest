-- Phase 5 Fix: Add missing columns to existing metrics table

ALTER TABLE metrics ADD COLUMN IF NOT EXISTS fetched_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS comment_count bigint NOT NULL DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS share_count bigint NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS metrics_entry_id_idx      ON metrics(entry_id);
CREATE INDEX IF NOT EXISTS metrics_entry_fetched_idx ON metrics(entry_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS metrics_fetched_at_idx    ON metrics(fetched_at DESC);

-- RLS
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metrics_select_public" ON metrics;
CREATE POLICY "metrics_select_public" ON metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "metrics_insert_service" ON metrics;
CREATE POLICY "metrics_insert_service" ON metrics FOR INSERT WITH CHECK (true);

-- View: latest metric snapshot per entry
CREATE OR REPLACE VIEW latest_metrics AS
SELECT DISTINCT ON (entry_id)
  entry_id, view_count, like_count, comment_count, share_count, fetched_at
FROM metrics
ORDER BY entry_id, fetched_at DESC;
