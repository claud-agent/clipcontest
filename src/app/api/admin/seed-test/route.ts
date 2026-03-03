/**
 * POST /api/admin/seed-test
 * Creates a test contest with 4 synthetic entries + metrics snapshots
 * to demonstrate the scoring engine.
 *
 * Scenarios:
 *   A) Organic growth  — gradual views + proportional engagement → score ~7
 *   B) Bot spike       — massive view spike, zero engagement    → flags + penalty
 *   C) Viral           — proportional spike with engagement     → score ~9
 *   D) Under MIN_VIEWS — only 50 views                         → score = 0
 *
 * Each scenario uses a separate test-user so the unique_entry_per_user_contest
 * constraint is satisfied.
 */

import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper: build N snapshots spaced 30 min apart, ending at "now"
function buildSnapshots(
  points: { views: number; likes: number; comments: number; shares: number }[],
  entryId: string
) {
  const now = Date.now()
  const totalMinutes = (points.length - 1) * 30
  return points.map((p, i) => ({
    entry_id:      entryId,
    view_count:    p.views,
    like_count:    p.likes,
    comment_count: p.comments,
    share_count:   p.shares,
    fetched_at:    new Date(now - (totalMinutes - i * 30) * 60_000).toISOString(),
  }))
}

/**
 * Get or create a test auth user, return their user ID.
 * Uses Supabase admin API (service role) to create/find users by email.
 */
async function getOrCreateTestUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  email: string,
  displayName: string
): Promise<string> {
  // Try creating the user first
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    password: `Test_${Math.random().toString(36).slice(2)}!`, // random, never used
    user_metadata: { full_name: displayName },
  })

  if (created?.user) {
    // Upsert a profile row so the foreign key is satisfied
    await service.from('profiles').upsert({
      id:               created.user.id,
      full_name:        displayName,
      tiktok_username:  displayName,
    })
    return created.user.id
  }

  // User already exists — find them by listing (max 1000 users)
  if (createErr?.message?.includes('already been registered') ||
      createErr?.message?.includes('already exists') ||
      createErr?.status === 422) {
    const { data: list } = await service.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users?.find((u: { email: string }) => u.email === email)
    if (existing) return existing.id
  }

  throw new Error(`Could not get or create test user ${email}: ${createErr?.message}`)
}

export async function POST() {
  // ── Auth check ──────────────────────────────────────────────
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── 1. Create test contest ───────────────────────────────────
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: contest, error: contestErr } = await service
    .from('contests')
    .insert({
      creator_id:            user.id,
      title:                 '🧪 Test Contest — Scoring Demo',
      description:           'Automatisch generierter Test-Contest mit synthetischen Daten.',
      status:                'active',
      prize:                 1000,
      end_date:              endDate,
      participation_hashtag: '#testcontest',
      is_public:             true,
    })
    .select('id')
    .single()

  if (contestErr || !contest) {
    return NextResponse.json({ error: contestErr?.message ?? 'Contest creation failed' }, { status: 500 })
  }

  const contestId = contest.id

  // ── 2. Define 4 test scenarios ───────────────────────────────
  // Each gets a unique test-user email so the unique_entry_per_user_contest
  // constraint is not violated.
  const scenarios = [
    {
      title:   '📈 Organic Growth',
      email:   'test-organic@clipcontest.test',
      author:  'organic_creator',
      videoId: `test_organic_${contestId.slice(0, 8)}`,
      points: [
        { views:  1000, likes:  60, comments:  8, shares: 3 },
        { views:  3000, likes: 180, comments: 24, shares: 9 },
        { views:  6000, likes: 360, comments: 48, shares: 18 },
        { views: 10000, likes: 600, comments: 80, shares: 30 },
        { views: 15000, likes: 900, comments: 120, shares: 45 },
        { views: 20000, likes: 1200, comments: 160, shares: 60 },
        { views: 26000, likes: 1560, comments: 208, shares: 78 },
        { views: 32000, likes: 1920, comments: 256, shares: 96 },
      ],
    },
    {
      title:   '🤖 Bot Spike (Low Engagement)',
      email:   'test-bot@clipcontest.test',
      author:  'suspicious_account',
      videoId: `test_bot_${contestId.slice(0, 8)}`,
      points: [
        { views:   500, likes:  25, comments:  3, shares: 1 },
        { views:   800, likes:  40, comments:  5, shares: 2 },
        { views:  1200, likes:  60, comments:  8, shares: 3 },
        { views:  1600, likes:  80, comments: 10, shares: 4 },
        { views: 50000, likes:  82, comments: 10, shares: 4 }, // 🚨 spike, no engagement!
        { views: 100000, likes: 85, comments: 11, shares: 4 },
        { views: 150000, likes: 88, comments: 12, shares: 5 },
      ],
    },
    {
      title:   '🚀 Viral (Proportional Spike)',
      email:   'test-viral@clipcontest.test',
      author:  'viral_creator',
      videoId: `test_viral_${contestId.slice(0, 8)}`,
      points: [
        { views:   2000, likes:   100, comments:   15, shares:   8 },
        { views:   4000, likes:   200, comments:   30, shares:  16 },
        { views:   6000, likes:   300, comments:   45, shares:  24 },
        { views:  20000, likes:  1200, comments:  200, shares: 100 },
        { views:  60000, likes:  3600, comments:  600, shares: 300 },
        { views: 120000, likes:  7200, comments: 1200, shares: 600 },
      ],
    },
    {
      title:   '📉 Under Min Views',
      email:   'test-small@clipcontest.test',
      author:  'new_creator',
      videoId: `test_small_${contestId.slice(0, 8)}`,
      points: [
        { views: 20, likes: 5, comments: 1, shares: 0 },
        { views: 35, likes: 8, comments: 2, shares: 0 },
        { views: 50, likes: 10, comments: 3, shares: 1 },
      ],
    },
  ]

  const results = []

  for (const scenario of scenarios) {
    // ── Get or create a unique test user for this scenario ──
    let scenarioUserId: string
    try {
      scenarioUserId = await getOrCreateTestUser(service, scenario.email, scenario.author)
    } catch (err) {
      results.push({ scenario: scenario.title, error: `User creation failed: ${(err as Error).message}` })
      continue
    }

    // ── Insert entry ──────────────────────────────────────────
    const { data: entry, error: entryErr } = await service
      .from('entries')
      .insert({
        contest_id:        contestId,
        user_id:           scenarioUserId,
        video_url:         `https://www.tiktok.com/@${scenario.author}/video/${scenario.videoId}`,
        platform_video_id: scenario.videoId,
        video_title:       scenario.title,
        author_name:       scenario.author,
        thumbnail_url:     null,
        status:            'approved',
      })
      .select('id')
      .single()

    if (entryErr || !entry) {
      results.push({ scenario: scenario.title, error: entryErr?.message })
      continue
    }

    // ── Insert metric snapshots ───────────────────────────────
    const snapshots = buildSnapshots(scenario.points, entry.id)
    const { error: metricsErr } = await service.from('metrics').insert(snapshots)

    if (metricsErr) {
      results.push({ scenario: scenario.title, error: metricsErr.message })
      continue
    }

    results.push({ scenario: scenario.title, entryId: entry.id, snapshots: snapshots.length })
  }

  return NextResponse.json({
    ok: true,
    contest_id: contestId,
    contest_url: `/c/${contestId}`,
    results,
  })
}
