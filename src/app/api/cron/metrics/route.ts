import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { computeScore, type Snapshot } from '@/lib/scoring/engine'

export const dynamic = 'force-dynamic'

// ── Refresh an expired TikTok access token ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshTikTokToken(
  supabase: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!res.ok) {
      console.warn('[metrics-cron] token refresh failed:', res.status)
      return null
    }

    const data = await res.json()
    if (data.error || !data.access_token) {
      console.warn('[metrics-cron] token refresh error:', data.error)
      return null
    }

    // Persist new tokens to DB (cast needed: new columns not in generated types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').update({
      tiktok_access_token:    data.access_token,
      tiktok_refresh_token:   data.refresh_token ?? refreshToken,
      tiktok_token_expires_at: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
    }).eq('id', userId)

    console.log('[metrics-cron] token refreshed for user', userId)
    return data.access_token
  } catch (err) {
    console.error('[metrics-cron] token refresh exception:', err)
    return null
  }
}

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
      profiles!inner(tiktok_access_token, tiktok_refresh_token)
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
      let activeToken = token
      let res = await fetch(
        'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filters: { video_ids: videoIds } }),
        }
      )

      // ── Auto-refresh on 401 ──────────────────────────────────
      if (res.status === 401) {
        const userId = userEntries[0].user_id
        const refreshToken = (userEntries[0].profiles as any)?.tiktok_refresh_token

        if (refreshToken && userId) {
          const newToken = await refreshTikTokToken(supabase, userId, refreshToken)
          if (newToken) {
            activeToken = newToken
            res = await fetch(
              'https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filters: { video_ids: videoIds } }),
              }
            )
          }
        }
      }

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
