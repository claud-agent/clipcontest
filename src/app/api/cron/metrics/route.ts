import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { computeScore, type Snapshot } from '@/lib/scoring/engine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all approved entries from active contests with TikTok token
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      id,
      platform_video_id,
      user_id,
      contest_id,
      contests!inner(status),
      profiles!inner(tiktok_access_token)
    `)
    .eq('status', 'approved')
    .eq('contests.status', 'active')
    .not('platform_video_id', 'is', null)

  if (error) {
    console.error('[metrics-cron] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!entries?.length) {
    return NextResponse.json({ fetched: 0, failed: 0, scored: 0, message: 'No active entries' })
  }

  let fetched = 0
  let failed  = 0
  let scored  = 0

  // Group by token for batched TikTok API calls
  const tokenMap = new Map<string, typeof entries>()
  for (const entry of entries) {
    const token = (entry.profiles as any)?.tiktok_access_token
    if (!token) { failed++; continue }
    if (!tokenMap.has(token)) tokenMap.set(token, [])
    tokenMap.get(token)!.push(entry)
  }

  for (const [token, userEntries] of Array.from(tokenMap.entries())) {
    const videoIds = userEntries
      .map(e => e.platform_video_id)
      .filter((id): id is string => !!id)

    try {
      const res = await fetch(
        'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters: { video_ids: videoIds } }),
        }
      )

      if (!res.ok) {
        console.warn(`[metrics-cron] TikTok API error ${res.status}`)
        failed += userEntries.length
        continue
      }

      const data = await res.json()
      const videos: Array<{
        id: string
        view_count?:    number
        like_count?:    number
        comment_count?: number
        share_count?:   number
      }> = data.data?.videos ?? []

      const metricsInserts = videos
        .map(v => {
          const entry = userEntries.find(e => e.platform_video_id === v.id)
          if (!entry) return null
          return {
            entry_id:      entry.id,
            view_count:    v.view_count    ?? 0,
            like_count:    v.like_count    ?? 0,
            comment_count: v.comment_count ?? 0,
            share_count:   v.share_count   ?? 0,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      if (metricsInserts.length) {
        const { error: insertErr } = await supabase.from('metrics').insert(metricsInserts)
        if (insertErr) {
          console.error('[metrics-cron] insert error:', insertErr.message)
          failed += metricsInserts.length
        } else {
          fetched += metricsInserts.length

          // ── Compute + persist scores for each entry ──
          for (const m of metricsInserts) {
            try {
              const { data: allSnaps } = await supabase
                .from('metrics')
                .select('view_count, like_count, comment_count, share_count, fetched_at')
                .eq('entry_id', m.entry_id)
                .order('fetched_at', { ascending: true })

              const snapshots: Snapshot[] = (allSnaps ?? []).map(s => ({
                view_count:    s.view_count,
                like_count:    s.like_count,
                comment_count: s.comment_count,
                share_count:   s.share_count ?? 0,
                fetched_at:    s.fetched_at,
              }))

              const result = computeScore(snapshots)

              // Write score back to entry
              await supabase
                .from('entries')
                .update({
                  base_score:       result.base_score,
                  final_score:      result.final_score,
                  penalty:          result.penalty,
                  flag_count:       result.flag_count,
                  under_review:     result.under_review,
                  score_updated_at: new Date().toISOString(),
                })
                .eq('id', m.entry_id)

              // Write flag record
              await supabase
                .from('video_flags')
                .insert({
                  entry_id:       m.entry_id,
                  spike_ratio:    result.flags.spike_ratio,
                  decoupling:     result.flags.decoupling,
                  rate_jump:      result.flags.rate_jump,
                  flag_count:     result.flag_count,
                  penalty:        result.penalty,
                  snapshots_used: snapshots.length,
                  details:        result.details,
                })

              scored++
            } catch (scoreErr) {
              console.error('[metrics-cron] scoring error for entry', m.entry_id, scoreErr)
            }
          }
        }
      }
    } catch (err) {
      console.error('[metrics-cron] fetch error:', err)
      failed += userEntries.length
    }

    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`[metrics-cron] done — fetched: ${fetched}, failed: ${failed}, scored: ${scored}`)
  return NextResponse.json({
    fetched,
    failed,
    scored,
    timestamp: new Date().toISOString(),
  })
}
