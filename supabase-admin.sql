-- ============================================
-- ClipContest Admin Panel — DB Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'creator';
ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- 2. Admin RLS policies for contests
CREATE POLICY "Admins can view all contests"
  ON contests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR creator_id = auth.uid()
    OR is_public = true
  );

CREATE POLICY "Admins can update all contests"
  ON contests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all contests"
  ON contests FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Admin RLS policies for entries
CREATE POLICY "Admins can view all entries"
  ON entries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all entries"
  ON entries FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all entries"
  ON entries FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Admin RLS policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR id = auth.uid()
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Admin RLS for metrics
CREATE POLICY "Admins can view all metrics"
  ON metrics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- IMPORTANT: Set your account as admin
-- Replace the email below with your actual email
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
