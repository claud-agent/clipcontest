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

// GET: List all contests
export async function GET(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('contests')
    .select('id, title, status, prize, creator_id, created_at, end_date, start_date, participation_hashtag')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with creator names + entry counts
  const creatorIds = Array.from(new Set((data ?? []).map(c => c.creator_id)))
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', creatorIds)

  const creatorMap = new Map((creators ?? []).map(c => [c.id, c.full_name || c.email || 'Unbekannt']))

  const contestIds = (data ?? []).map(c => c.id)
  const entryCounts: Record<string, number> = {}
  for (const id of contestIds) {
    const { count } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', id)
    entryCounts[id] = count ?? 0
  }

  const enriched = (data ?? []).map(c => ({
    ...c,
    creator_name: creatorMap.get(c.creator_id) ?? 'Unbekannt',
    entry_count: entryCounts[c.id] ?? 0,
  }))

  return NextResponse.json({ contests: enriched })
}

// PATCH: Update contest status
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, status } = body as { id: string; status: 'draft' | 'active' | 'ended' }

  if (!id || !['draft', 'active', 'ended'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('contests')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
