/**
 * POST /api/admin/trigger-metrics
 * Admin-only endpoint to manually trigger metrics collection
 */
import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  // Admin check
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  const { data: profile } = await service
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Call the cron endpoint internally with the secret
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clipcontest.vercel.app'
  const secret  = process.env.CRON_SECRET

  const res = await fetch(`${baseUrl}/api/cron/metrics`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
