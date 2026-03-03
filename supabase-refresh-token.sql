-- TikTok Refresh Token Support
-- Run this once in the Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_token_expires_at TIMESTAMPTZ;
