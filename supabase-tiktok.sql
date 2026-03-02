-- TikTok fields for profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_user_id TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_username TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_avatar TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_scope TEXT;
