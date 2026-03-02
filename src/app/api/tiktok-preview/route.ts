import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }

  if (!url.includes('tiktok.com')) {
    return NextResponse.json({ error: 'Not a TikTok URL' }, { status: 400 })
  }

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not fetch preview' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({
      title: data.title ?? null,
      author_name: data.author_name ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      thumbnail_width: data.thumbnail_width ?? null,
      thumbnail_height: data.thumbnail_height ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Preview unavailable' }, { status: 500 })
  }
}
