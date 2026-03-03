import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { computeScore, computeBaseScore, type Snapshot } from '@/lib/scoring/engine'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use the same service-role client as admin/debug endpoints
  const supabase = createServerSupabaseClient()

  // ── 1. Fetch approved entries WITH cached score columns ────────
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select(`
      id,
      video_url,
      video_title,
      author_name,
      thumbnail_url,
      platform_video_id,
      submitted_at,
      base_score,
      final_score,
      penalty,
      flag_count,
      under_review,
      score_updated_at
    `)
    .eq('contest_id', params.id)
    .eq('status', 'approved')

  if (entriesError) {
    // If score columns don't exist yet, retry without them
    const { data: fallbackEntries, error: fallbackError } = await supabase
      .from('entries')
      .select('id, video_url, video_title, author_name, thumbnail_url, platform_video_id, submitted_at')
      .eq('contest_id', params.id)
      .eq('status', 'approved')

    if (fallbackError || !fallbackEntries?.length) {
      return NextResponse.json({
        entries: [],
        updatedAt: null,
        _debug: { error: entriesError.message, fallbackError: fallbackError?.message },
      })
    }

    // Map fallback entries with no scores
    return NextResponse.json({
      entries: fallbackEntries.map(e => buildEntry(e, null, null)),
      updatedAt: null,
      _debug: { note: 'score columns missing, used fallback query' },
    })
  }

  if (!entries?.length) {
    return NextResponse.json({ entries: [], updatedAt: null })
  }

  // ── 2. Fetch metrics for live score computation ────────────────
  const entryIds = entries.map(e => e.id)
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics')
    .select('entry_id, view_count, like_count, comment_count, share_count, fetched_at')
    .in('entry_id', entryIds)
    .order('fetched_at', { ascending: true })

  // Group snapshots by entry
  const snapshotsByEntry = new Map<string, Snapshot[]>()
  for (const m of metrics ?? []) {
    if (!snapshotsByEntry.has(m.entry_id)) snapshotsByEntry.set(m.entry_id, [])
    snapshotsByEntry.get(m.entry_id)!.push({
      view_count:    m.view_count,
      like_count:    m.like_count,
      comment_count: m.comment_count,
      share_count:   m.share_count ?? 0,
      fetched_at:    m.fetched_at,
    })
  }

  // ── 3. Enrich entries: live scores if metrics exist, cached otherwise
  const enriched = entries.map(entry => {
    const snapshots = snapshotsByEntry.get(entry.id) ?? []
    const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null

    if (snapshots.length > 0) {
      // LIVE score from metrics
      return buildEntry(entry, snapshots, latest)
    }

    // FALLBACK: use cached scores from entries table
    const cachedScore = entry.final_score ?? 0
    const cachedBase  = entry.base_score ?? 0
    return {
      id:            entry.id,
      video_url:     entry.video_url,
      video_title:   entry.video_title,
      author_name:   entry.author_name,
      thumbnail_url: entry.thumbnail_url,
      submitted_at:  entry.submitted_at,
      view_count:    0,
      like_count:    0,
      comment_count: 0,
      share_count:   0,
      like_rate:     0,
      comment_rate:  0,
      share_rate:    0,
      base_score:    cachedBase,
      final_score:   cachedScore,
      penalty:       entry.penalty ?? 0,
      flag_count:    entry.flag_count ?? 0,
      under_review:  entry.under_review ?? false,
      flags:         { spike_ratio: false, decoupling: false, rate_jump: false },
      components:    { v: 0, l: 0, c: 0, sh: 0 },
      snapshots_used: 0,
      score:         cachedScore,
      growth:        0,
      anomaly:       (entry.flag_count ?? 0) > 0,
      updatedAt:     entry.score_updated_at ?? null,
    }
  })

  // Sort: final_score desc → base_score desc → view_count desc
  enriched.sort((a, b) => {
    if (b.final_score !== a.final_score) return b.final_score - a.final_score
    if (b.base_score  !== a.base_score)  return b.base_score  - a.base_score
    return b.view_count - a.view_count
  })

  const updatedAt = metrics?.length ? metrics[metrics.length - 1].fetched_at : null

  return NextResponse.json({
    entries: enriched,
    updatedAt,
    _debug: {
      entryCount:    entries.length,
      metricsCount:  metrics?.length ?? 0,
      metricsError:  metricsError?.message ?? null,
      entryIds,
      supabaseUrl:   process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET',
      serviceKey:    process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    },
  })
}

// ── Helper: build a full entry response from snapshots ──────────
function buildEntry(
  entry: Record<string, unknown>,
  snapshots: Snapshot[] | null,
  latest: Snapshot | null
) {
  const scoreData = snapshots?.length ? computeScore(snapshots) : {
    base_score: 0, final_score: 0, penalty: 0, flag_count: 0,
    under_review: false, flags: { spike_ratio: false, decoupling: false, rate_jump: false },
    details: {},
  }

  const views    = latest?.view_count    ?? 0
  const likes    = latest?.like_count    ?? 0
  const comments = latest?.comment_count ?? 0
  const shares   = latest?.share_count   ?? 0

  const { components } = computeBaseScore(views, likes, comments, shares)
  const likeRate    = views > 0 ? likes    / views : 0
  const commentRate = views > 0 ? comments / views : 0
  const shareRate   = views > 0 ? shares   / views : 0

  return {
    id:            entry.id as string,
    video_url:     entry.video_url as string,
    video_title:   entry.video_title as string | null,
    author_name:   entry.author_name as string | null,
    thumbnail_url: entry.thumbnail_url as string | null,
    submitted_at:  entry.submitted_at as string | null,
    view_count:    views,
    like_count:    likes,
    comment_count: comments,
    share_count:   shares,
    like_rate:     Math.round(likeRate    * 10000) / 10000,
    comment_rate:  Math.round(commentRate * 10000) / 10000,
    share_rate:    Math.round(shareRate   * 10000) / 10000,
    base_score:    scoreData.base_score,
    final_score:   scoreData.final_score,
    penalty:       scoreData.penalty,
    flag_count:    scoreData.flag_count,
    under_review:  scoreData.under_review,
    flags:         scoreData.flags,
    components,
    snapshots_used: snapshots?.length ?? 0,
    score:         scoreData.final_score,
    growth:        0,
    anomaly:       scoreData.flag_count > 0,
    updatedAt:     latest?.fetched_at ?? null,
  }
}
