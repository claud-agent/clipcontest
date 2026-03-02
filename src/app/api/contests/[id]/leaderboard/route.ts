import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(_request.url)
  const mode = (searchParams.get('mode') ?? 'views') as 'views' | 'growth' | 'score'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch approved entries
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      id,
      video_url,
      video_title,
      author_name,
      thumbnail_url,
      platform_video_id
    `)
    .eq('contest_id', params.id)
    .eq('status', 'approved')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!entries?.length) {
    return NextResponse.json({ entries: [], updatedAt: null, mode })
  }

  // Fetch latest 2 metric snapshots per entry for growth calculation
  const entryIds = entries.map(e => e.id)
  const { data: metrics } = await supabase
    .from('metrics')
    .select('entry_id, view_count, like_count, comment_count, share_count, fetched_at')
    .in('entry_id', entryIds)
    .order('fetched_at', { ascending: false })

  // Group metrics by entry_id
  const metricsByEntry = new Map<string, typeof metrics>()
  for (const m of metrics ?? []) {
    if (!metricsByEntry.has(m.entry_id)) metricsByEntry.set(m.entry_id, [])
    metricsByEntry.get(m.entry_id)!.push(m)
  }

  // Enrich entries with scores
  const enriched = entries.map(entry => {
    const entryMetrics = metricsByEntry.get(entry.id) ?? []
    const latest = entryMetrics[0] ?? null

    // Find a snapshot at least 15 minutes old for growth comparison
    const baseline = entryMetrics.find(m => {
      const ageMs = Date.now() - new Date(m.fetched_at).getTime()
      return ageMs >= 15 * 60 * 1000
    })

    const latestViews = latest?.view_count ?? 0
    const baselineViews = baseline?.view_count ?? 0
    const growth = Math.max(0, latestViews - baselineViews)

    const likes = latest?.like_count ?? 0
    const comments = latest?.comment_count ?? 0
    const shares = latest?.share_count ?? 0
    const engagement = likes * 2 + comments * 3 + shares * 5

    // Anomaly flag: growth > 5x average in window
    const avgViews = entryMetrics.length > 1
      ? entryMetrics.reduce((sum, m) => sum + m.view_count, 0) / entryMetrics.length
      : latestViews
    const anomaly = growth > 0 && latestViews > avgViews * 5

    let score = 0
    if (mode === 'views') score = latestViews
    else if (mode === 'growth') score = growth
    else score = growth + engagement

    return {
      id: entry.id,
      video_url: entry.video_url,
      video_title: entry.video_title,
      author_name: entry.author_name,
      thumbnail_url: entry.thumbnail_url,
      view_count: latestViews,
      like_count: likes,
      comment_count: comments,
      share_count: shares,
      growth,
      score,
      anomaly,
      updatedAt: latest?.fetched_at ?? null,
    }
  })

  enriched.sort((a, b) => b.score - a.score)

  // Global last-updated = most recent metric across all entries
  const updatedAt = metrics?.length ? metrics[0].fetched_at : null

  return NextResponse.json({ entries: enriched, updatedAt, mode })
}
