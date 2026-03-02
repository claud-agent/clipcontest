import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY!
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clipcontest.vercel.app'}/api/auth/tiktok/callback`

  // Random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15)

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  })

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`

  const response = NextResponse.redirect(authUrl)
  // Store state in cookie for validation
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })

  return response
}
