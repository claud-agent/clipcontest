import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get TikTok access token from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tiktok_access_token, tiktok_username')
    .eq('id', user.id)
    .single()

  if (!profile?.tiktok_access_token) {
    return NextResponse.json({ error: 'TikTok not connected' }, { status: 400 })
  }

  try {
    const res = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,view_count,like_count,create_time',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${profile.tiktok_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: 20 }),
      }
    )

    const data = await res.json()

    if (data.error?.code && data.error.code !== 'ok') {
      console.error('TikTok API error:', data.error)
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({
      videos: data.data?.videos ?? [],
      username: profile.tiktok_username,
    })
  } catch (err) {
    console.error('TikTok videos fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
