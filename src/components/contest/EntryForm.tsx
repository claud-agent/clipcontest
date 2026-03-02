'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type Props = {
  contestId: string
  isActive: boolean
  hasSubmitted: boolean
  user: User | null
  hashtag: string | null
}

function extractTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/)
  return match ? match[1] : null
}

export default function EntryForm({ contestId, isActive, hasSubmitted, user, hashtag }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isActive) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Dieser Contest nimmt keine Einreichungen an.
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-green-400 font-medium">Du hast bereits teilgenommen!</p>
          <p className="text-gray-500 text-xs">Deine Einreichung wird geprüft.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-4">Du musst angemeldet sein, um teilzunehmen.</p>
        <a
          href={`/auth/login?next=/c/${contestId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-500/90 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Jetzt anmelden & teilnehmen
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-green-400 font-medium">Einreichung erfolgreich!</p>
          <p className="text-gray-500 text-xs">Viel Glück! Dein Video ist im Rennen.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.includes('tiktok.com')) {
      setError('Bitte einen gültigen TikTok-Link eingeben.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const platformVideoId = extractTikTokId(url)

    const { error: err } = await supabase.from('entries').insert({
      contest_id: contestId,
      user_id: user!.id,
      video_url: url,
      platform_video_id: platformVideoId,
      status: 'pending',
    })

    if (err) {
      if (err.code === '23505') {
        setError('Du hast bereits einen Beitrag eingereicht.')
      } else {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Dein TikTok-Video-Link
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@username/video/..."
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
        />
        {hashtag && (
          <p className="text-gray-500 text-xs mt-1">
            ⚠️ Stelle sicher, dass dein Video den Hashtag <span className="text-brand-500">{hashtag}</span> enthält.
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url}
        className="w-full py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? 'Wird eingereicht...' : '🎬 Video einreichen'}
      </button>
    </form>
  )
}
