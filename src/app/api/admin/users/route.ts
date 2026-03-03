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

// GET: List all users
export async function GET() {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, tiktok_username, tiktok_avatar, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with contest counts
  const userIds = (data ?? []).map(u => u.id)
  const contestCounts: Record<string, number> = {}
  for (const id of userIds) {
    const { count } = await supabase
      .from('contests')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', id)
    contestCounts[id] = count ?? 0
  }

  const enriched = (data ?? []).map(u => ({
    ...u,
    contest_count: contestCounts[u.id] ?? 0,
  }))

  return NextResponse.json({ users: enriched })
}

// PATCH: Update user role
export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, role } = body as { id: string; role: 'creator' | 'participant' | 'admin' }

  if (!id || !['creator', 'participant', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
