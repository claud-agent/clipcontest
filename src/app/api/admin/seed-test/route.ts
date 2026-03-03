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
 */

import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper: build N snapshots starting from `startMinutesAgo`, spaced 30 min apart
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

export async function POST() {
  // Admin check
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── 1. Create test contest ──────────────────────────────────
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

  // ── 2. Define 4 test scenarios ──────────────────────────────
  const scenarios = [
    {
      title:   '📈 Organic Growth',
      author:  'organic_creator',
      videoId: 'test_organic_001',
      // Steady growth, good engagement rates
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
      author:  'suspicious_account',
      videoId: 'test_bot_002',
      // Normal start, then massive view spike with zero engagement
      points: [
        { views:  500,   likes:  25, comments:  3, shares: 1 },
        { views:  800,   likes:  40, comments:  5, shares: 2 },
        { views: 1200,   likes:  60, comments:  8, shares: 3 },
        { views: 1600,   likes:  80, comments: 10, shares: 4 },
        { views: 50000,  likes:  82, comments: 10, shares: 4 }, // 🚨 spike, no engagement!
        { views: 100000, likes:  85, comments: 11, shares: 4 }, // continues, still no engagement
        { views: 150000, likes:  88, comments: 12, shares: 5 },
      ],
    },
    {
      title:   '🚀 Viral (Proportional Spike)',
      author:  'viral_creator',
      videoId: 'test_viral_003',
      // Genuine viral moment: views AND engagement spike together
      points: [
        { views:  2000, likes:  100, comments:  15, shares:  8 },
        { views:  4000, likes:  200, comments:  30, shares: 16 },
        { views:  6000, likes:  300, comments:  45, shares: 24 },
        { views: 20000, likes: 1200, comments: 200, shares: 100 }, // viral spike + good engagement
        { views: 60000, likes: 3600, comments: 600, shares: 300 },
        { views: 120000, likes: 7200, comments: 1200, shares: 600 },
      ],
    },
    {
      title:   '📉 Under Min Views',
      author:  'new_creator',
      videoId: 'test_small_004',
      // Below MIN_VIEWS — score should be 0
      points: [
        { views: 20, likes: 5, comments: 1, shares: 0 },
        { views: 35, likes: 8, comments: 2, shares: 0 },
        { views: 50, likes: 10, comments: 3, shares: 1 },
      ],
    },
  ]

  const results = []

  for (const scenario of scenarios) {
    // Insert entry
    const { data: entry, error: entryErr } = await service
      .from('entries')
      .insert({
        contest_id:        contestId,
        user_id:           user.id,
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

    // Insert metric snapshots
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
