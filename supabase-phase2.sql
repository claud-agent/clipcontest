-- ============================================
-- ClipContest Phase 2 - DB Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'participant', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Contests
CREATE TABLE IF NOT EXISTS contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'tiktok' CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  prize DECIMAL(10,2) DEFAULT 0,
  rules TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  hashtag TEXT,
  max_entries INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entries
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  platform_video_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Metrics
CREATE TABLE IF NOT EXISTS metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, only own profile editable
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Contests: public read, only creator can write
CREATE POLICY "Contests are viewable by everyone" ON contests FOR SELECT USING (true);
CREATE POLICY "Creators can insert contests" ON contests FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own contests" ON contests FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own contests" ON contests FOR DELETE USING (auth.uid() = creator_id);

-- Entries: public read, authenticated users can insert
CREATE POLICY "Entries are viewable by everyone" ON entries FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON entries FOR UPDATE USING (auth.uid() = user_id);

-- Metrics: public read, service role inserts
CREATE POLICY "Metrics are viewable by everyone" ON metrics FOR SELECT USING (true);
