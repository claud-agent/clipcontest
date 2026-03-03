import { createClient } from '@/utils/supabase/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServerSupabaseClient()
  await service.from('profiles').update({
    tiktok_access_token:    null,
    tiktok_refresh_token:   null,
    tiktok_token_expires_at: null,
    tiktok_user_id:          null,
    tiktok_username:         null,
    tiktok_avatar:           null,
    tiktok_scope:            null,
  } as any).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
