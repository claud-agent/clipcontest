'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import VideoSelector from './VideoSelector'

type Props = {
  contestId: string
  isActive: boolean
  hasSubmitted: boolean
  user: User | null
  hashtag: string | null
  tiktokConnected?: boolean
}

type SelectedVideo = {
  id: string
  title: string
  cover_image_url: string
  share_url: string
}

export default function EntryForm({ contestId, isActive, hasSubmitted, user, hashtag, tiktokConnected }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<SelectedVideo | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isActive) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Dieser Contest nimmt gerade keine Einreichungen an.
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-green-400 font-semibold">Du hast bereits teilgenommen!</p>
          <p className="text-gray-500 text-xs mt-0.5">Deine Einreichung wird geprüft. Viel Glück!</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-4">Melde dich an, um deinen Clip einzureichen.</p>
        <a
          href={`/auth/login?next=/c/${contestId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-500/90 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Jetzt anmelden & teilnehmen →
        </a>
      </div>
    )
  }

  if (!tiktokConnected) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-gray-400 text-sm">Verbinde deinen TikTok-Account, um teilzunehmen.</p>
        <a
          href="/api/auth/tiktok"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#010101] hover:bg-[#010101]/80 border border-white/10 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
          </svg>
          Mit TikTok verbinden
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-green-400 font-semibold text-lg">Einreichung erfolgreich!</p>
        <p className="text-gray-400 text-sm mt-1">Dein Video ist im Rennen. Viel Erfolg!</p>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selected) {
      setError('Bitte wähle ein Video aus.')
      return
    }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const platformVideoId = selected.id

    const { error: err } = await supabase.from('entries').insert({
      contest_id: contestId,
      user_id: user!.id,
      video_url: selected.share_url,
      platform_video_id: platformVideoId,
      status: 'pending',
      thumbnail_url: selected.cover_image_url ?? null,
      video_title: selected.title ?? null,
      author_name: null,
      is_owner_confirmed: true,
    })

    if (err) {
      if (err.code === '23505') {
        setError('Du hast für diesen Contest bereits ein Video eingereicht.')
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
    <div className="space-y-4">
      {hashtag && (
        <p className="text-gray-400 text-xs text-center">
          ⚠️ Dein Video muss den Hashtag <span className="text-brand-500 font-medium">{hashtag}</span> enthalten.
        </p>
      )}

      <VideoSelector
        selectedId={selected?.id}
        onSelect={(video) => {
          setSelected(video)
          setError('')
        }}
      />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !selected}
        className="w-full py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Wird eingereicht...
          </>
        ) : (
          '🎬 Video einreichen'
        )}
      </button>
    </div>
  )
}
