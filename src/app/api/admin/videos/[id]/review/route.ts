/**
 * POST /api/admin/videos/:id/review
 *
 * Admin override endpoint for manually adjusting a video's score / review status.
 *
 * Body:
 *   action: 'clear_flags'    → reset penalty/flags, remove under_review
 *           'set_score'      → manually set final_score (0-10)
 *           'disqualify'     → set final_score=0, under_review=true
 *           'flag_review'    → set under_review=true without changing score
 *
 * Optional:
 *   final_score: number      → required for action='set_score'
 *   note: string             → admin note stored in video_flags details
 */

import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { clamp } from '@/lib/scoring/engine'

type ReviewAction = 'clear_flags' | 'set_score' | 'disqualify' | 'flag_review'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Admin check
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const entryId = params.id
  const body = await request.json() as { action: ReviewAction; final_score?: number; note?: string }
  const { action, note } = body

  if (!['clear_flags', 'set_score', 'disqualify', 'flag_review'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Fetch current entry
  const { data: entry } = await service
    .from('entries')
    .select('id, base_score, final_score, penalty, flag_count, under_review')
    .eq('id', entryId)
    .single()

  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  let update: Record<string, unknown> = { score_updated_at: new Date().toISOString() }
  let flagInsert: Record<string, unknown> | null = null

  switch (action) {
    case 'clear_flags':
      update = {
        ...update,
        penalty:      0,
        flag_count:   0,
        under_review: false,
        final_score:  entry.base_score ?? 0,
      }
      flagInsert = {
        entry_id:  entryId,
        spike_ratio: false, decoupling: false, rate_jump: false,
        flag_count: 0, penalty: 0,
        details: { admin_override: 'clear_flags', admin_id: user.id, note },
      }
      break

    case 'set_score': {
      const manualScore = clamp(body.final_score ?? 0, 0, 10)
      update = { ...update, final_score: manualScore, under_review: false }
      flagInsert = {
        entry_id: entryId,
        spike_ratio: false, decoupling: false, rate_jump: false,
        flag_count: entry.flag_count ?? 0,
        penalty: entry.penalty ?? 0,
        details: { admin_override: 'set_score', score: manualScore, admin_id: user.id, note },
      }
      break
    }

    case 'disqualify':
      update = { ...update, final_score: 0, under_review: true, penalty: -10 }
      flagInsert = {
        entry_id: entryId,
        spike_ratio: true, decoupling: true, rate_jump: false,
        flag_count: 3, penalty: -10,
        details: { admin_override: 'disqualify', admin_id: user.id, note },
      }
      break

    case 'flag_review':
      update = { ...update, under_review: true }
      flagInsert = {
        entry_id: entryId,
        spike_ratio: false, decoupling: false, rate_jump: false,
        flag_count: entry.flag_count ?? 0,
        penalty: entry.penalty ?? 0,
        details: { admin_override: 'flag_review', admin_id: user.id, note },
      }
      break
  }

  const { error: updateErr } = await service
    .from('entries')
    .update(update)
    .eq('id', entryId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  if (flagInsert) {
    await service.from('video_flags').insert(flagInsert)
  }

  return NextResponse.json({
    ok: true,
    entry_id: entryId,
    action,
    update,
  })
}
