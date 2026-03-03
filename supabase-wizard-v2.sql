-- Wizard V2: New columns for expanded contest wizard

-- Upload platforms (multi-select: tiktok, youtube, instagram)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS upload_platforms text[] DEFAULT '{}';

-- Content source type
ALTER TABLE contests ADD COLUMN IF NOT EXISTS content_source text DEFAULT 'all';
-- Values: 'recent' | 'timeline' | 'custom' | 'all' | 'upload' | 'link'

-- Content source details (JSON for flexible storage)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS content_source_data jsonb DEFAULT '{}';

-- Prize type
ALTER TABLE contests ADD COLUMN IF NOT EXISTS prize_type text DEFAULT 'cash';
-- Values: 'cash' | 'voucher' | 'custom'

-- Prize description (for voucher/custom prizes)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS prize_description text DEFAULT '';

-- Winner methods (multi-select array)
ALTER TABLE contests ADD COLUMN IF NOT EXISTS winner_methods text[] DEFAULT '{}';
-- Values: 'engagement' | 'total_views' | 'jury'

-- Budget split per winner method (JSON: { "engagement": 500, "total_views": 300, "jury": 200 })
ALTER TABLE contests ADD COLUMN IF NOT EXISTS method_budget_split jsonb DEFAULT '{}';
