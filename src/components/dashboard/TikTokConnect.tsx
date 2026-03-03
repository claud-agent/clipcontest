'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  tiktokUsername: string | null
}

export default function TikTokConnect({ tiktokUsername }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    setLoading(true)
    await fetch('/api/auth/tiktok/disconnect', { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  if (tiktokUsername) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
        <span className="text-lg">🎵</span>
        <div>
          <p className="text-white font-medium text-xs">@{tiktokUsername}</p>
          <p className="text-green-400 text-xs">TikTok verbunden ✓</p>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="ml-2 text-xs text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Trennen'}
        </button>
      </div>
    )
  }

  return (
    <a
      href="/api/auth/tiktok"
      className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-black/80 border border-white/10 text-white font-semibold rounded-xl transition-colors text-sm"
    >
      <span className="text-lg">🎵</span>
      Mit TikTok verbinden
    </a>
  )
}
