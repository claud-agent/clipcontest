import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function checkAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const serviceClient = createServerSupabaseClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

// GET: List all entries
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('entries')
    .select('id, video_url, video_title, author_name, thumbnail_url, status, submitted_at, contest_id, user_id')
    .order('submitted_at', { ascending: false })
    .limit(200)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with contest titles
  const contestIds = Array.from(new Set((data ?? []).map(e => e.contest_id)))
  const { data: contests } = await supabase
    .from('contests')
    .select('id, title')
    .in('id', contestIds)

  const contestMap = new Map((contests ?? []).map(c => [c.id, c.title]))

  const enriched = (data ?? []).map(e => ({
    ...e,
    contest_title: contestMap.get(e.contest_id) ?? 'Unbekannt',
  }))

  return NextResponse.json({ entries: enriched })
}

// PATCH: Update entry status
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { ids, status } = body as { ids: string[]; status: 'approved' | 'rejected' | 'pending' }

  if (!ids?.length || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('entries')
    .update({ status })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, updated: ids.length })
}
