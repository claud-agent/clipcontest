/**
 * GET /api/admin/debug-contest?id=<contestId>
 * Returns raw DB state for a contest: entries + metrics summary
 * Admin only. For debugging scoring issues.
 */
import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Admin check
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const contestId = req.nextUrl.searchParams.get('id')
  if (!contestId) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 })

  // 1. Contest info
  const { data: contest } = await service
    .from('contests')
    .select('id, title, status, end_date, creator_id')
    .eq('id', contestId)
    .single()

  // 2. All entries (any status)
  const { data: entries } = await service
    .from('entries')
    .select('id, status, platform_video_id, video_title, author_name, user_id, base_score, final_score, score_updated_at')
    .eq('contest_id', contestId)

  if (!entries?.length) {
    return NextResponse.json({ contest, entries: [], metrics_summary: [] })
  }

  // 3. Metrics count + latest snapshot per entry
  const entryIds = entries.map(e => e.id)
  const { data: metrics } = await service
    .from('metrics')
    .select('entry_id, view_count, like_count, comment_count, share_count, fetched_at')
    .in('entry_id', entryIds)
    .order('fetched_at', { ascending: false })

  // Group metrics by entry
  const metricsByEntry = new Map<string, typeof metrics>()
  for (const m of metrics ?? []) {
    if (!metricsByEntry.has(m.entry_id)) metricsByEntry.set(m.entry_id, [])
    metricsByEntry.get(m.entry_id)!.push(m)
  }

  // 4. TikTok token check
  const { data: creatorProfile } = await service
    .from('profiles')
    .select('id, tiktok_username, tiktok_access_token')
    .eq('id', contest?.creator_id ?? '')
    .single()

  const entries_summary = entries.map(e => {
    const entryMetrics = metricsByEntry.get(e.id) ?? []
    const latest = entryMetrics[0] // sorted desc, so [0] is latest
    return {
      entry_id:          e.id,
      status:            e.status,
      platform_video_id: e.platform_video_id,
      video_title:       e.video_title,
      metrics_count:     entryMetrics.length,
      latest_views:      latest?.view_count ?? null,
      latest_fetched_at: latest?.fetched_at ?? null,
      db_final_score:    e.final_score,
      db_base_score:     e.base_score,
      score_updated_at:  e.score_updated_at,
    }
  })

  return NextResponse.json({
    contest,
    tiktok_token_present: !!creatorProfile?.tiktok_access_token,
    tiktok_username:       creatorProfile?.tiktok_username,
    total_entries:         entries.length,
    total_metrics_rows:    (metrics ?? []).length,
    entries_summary,
  })
}
