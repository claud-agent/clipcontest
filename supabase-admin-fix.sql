-- ============================================
-- FIX: Remove recursive admin RLS policies
-- The admin API routes use service role client
-- which bypasses RLS, so these are not needed
-- ============================================

-- Drop all admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all contests" ON contests;
DROP POLICY IF EXISTS "Admins can update all contests" ON contests;
DROP POLICY IF EXISTS "Admins can delete all contests" ON contests;
DROP POLICY IF EXISTS "Admins can view all entries" ON entries;
DROP POLICY IF EXISTS "Admins can update all entries" ON entries;
DROP POLICY IF EXISTS "Admins can delete all entries" ON entries;
DROP POLICY IF EXISTS "Admins can view all metrics" ON metrics;

-- Done! The original policies from Phase 2 remain intact:
-- profiles: "Public profiles are viewable by everyone" (SELECT true)
-- profiles: "Users can update own profile" (UPDATE own)
-- contests: "Contests are viewable by everyone" (SELECT true)
-- contests: "Creators can insert/update/delete own contests"
-- entries: "Entries are viewable by everyone" (SELECT true)
-- entries: "Authenticated users can submit entries"
-- metrics: "Metrics are viewable by everyone" (SELECT true)
