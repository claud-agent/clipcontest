import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clipcontest.vercel.app'

  // User denied access
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=tiktok_denied`)
  }

  // Validate state
  const savedState = request.cookies.get('tiktok_oauth_state')?.value
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    // Exchange code for access token
    const redirectUri = `${origin}/api/auth/tiktok/callback`
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      console.error('TikTok token error:', tokenData)
      return NextResponse.redirect(`${origin}/auth/login?error=token_exchange`)
    }

    const { access_token, refresh_token, expires_in, open_id, scope } = tokenData

    // Fetch TikTok user info
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )
    const userData = await userRes.json()
    const tiktokUser = userData.data?.user

    // Save to Supabase profiles
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('profiles').update({
        tiktok_user_id: open_id,
        tiktok_username: tiktokUser?.username ?? tiktokUser?.display_name ?? null,
        tiktok_avatar: tiktokUser?.avatar_url ?? null,
        tiktok_access_token: access_token,
        tiktok_scope: scope,
        tiktok_refresh_token: refresh_token ?? null,
        tiktok_token_expires_at: expires_in
          ? new Date(Date.now() + expires_in * 1000).toISOString()
          : null,
      }).eq('id', user.id)
    }

    // Clear state cookie and redirect to dashboard
    const response = NextResponse.redirect(`${origin}/dashboard?tiktok=connected`)
    response.cookies.delete('tiktok_oauth_state')
    return response

  } catch (err) {
    console.error('TikTok callback error:', err)
    return NextResponse.redirect(`${origin}/auth/login?error=tiktok_error`)
  }
}
