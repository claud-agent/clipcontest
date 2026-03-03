import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Auth check
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await authClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerSupabaseClient()

  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Active contests
  const { count: activeContests } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Total contests
  const { count: totalContests } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true })

  // Total entries
  const { count: totalEntries } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })

  // Pending entries
  const { count: pendingEntries } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Entries today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: entriesToday } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', today.toISOString())

  // Entries per day (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: recentEntries } = await supabase
    .from('entries')
    .select('submitted_at')
    .gte('submitted_at', thirtyDaysAgo.toISOString())
    .order('submitted_at', { ascending: true })

  const entriesByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    entriesByDay[d.toISOString().split('T')[0]] = 0
  }
  for (const e of recentEntries ?? []) {
    if (e.submitted_at) {
      const day = new Date(e.submitted_at).toISOString().split('T')[0]
      if (entriesByDay[day] !== undefined) entriesByDay[day]++
    }
  }

  // Recent entries (last 10)
  const { data: latestEntries } = await supabase
    .from('entries')
    .select('id, video_title, video_url, thumbnail_url, status, submitted_at, contest_id')
    .order('submitted_at', { ascending: false })
    .limit(10)

  // Recent users (last 10)
  const { data: latestUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, tiktok_username, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeContests: activeContests ?? 0,
    totalContests: totalContests ?? 0,
    totalEntries: totalEntries ?? 0,
    pendingEntries: pendingEntries ?? 0,
    entriesToday: entriesToday ?? 0,
    entriesByDay,
    latestEntries: latestEntries ?? [],
    latestUsers: latestUsers ?? [],
  })
}
