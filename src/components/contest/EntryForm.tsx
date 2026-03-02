'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'
import VideoSelector from './VideoSelector'

type Props = {
  contestId: string
  isActive: boolean
  hasSubmitted: boolean
  user: User | null
  hashtag: string | null
  tiktokConnected?: boolean
}

type Preview = {
  title: string | null
  author_name: string | null
  thumbnail_url: string | null
}

function isValidTikTokUrl(url: string): boolean {
  return /tiktok\.com\/@[\w.]+\/video\/\d+/.test(url) ||
         /vm\.tiktok\.com\//.test(url) ||
         /vt\.tiktok\.com\//.test(url)
}

function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

export default function EntryForm({ contestId, isActive, hasSubmitted, user, hashtag, tiktokConnected }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>()
  const [isOwner, setIsOwner] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-fetch preview when URL looks valid
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setPreview(null)
    setPreviewError('')

    if (!url || !isValidTikTokUrl(url)) return

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const res = await fetch(`/api/tiktok-preview?url=${encodeURIComponent(url)}`)
        const data = await res.json()
        if (data.error) {
          setPreviewError('Vorschau nicht verfügbar — bitte prüfe den Link.')
        } else {
          setPreview(data)
        }
      } catch {
        setPreviewError('Vorschau nicht verfügbar.')
      } finally {
        setPreviewLoading(false)
      }
    }, 800)
  }, [url])

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

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-green-400 font-semibold text-lg">Einreichung erfolgreich!</p>
        <p className="text-gray-400 text-sm mt-1">Dein Video ist im Rennen. Viel Erfolg!</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isValidTikTokUrl(url)) {
      setError('Bitte einen gültigen TikTok-Link eingeben (z.B. https://www.tiktok.com/@user/video/...).')
      return
    }
    if (!isOwner) {
      setError('Bitte bestätige, dass du der Eigentümer des Videos bist.')
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
      thumbnail_url: preview?.thumbnail_url ?? null,
      video_title: preview?.title ?? null,
      author_name: preview?.author_name ?? null,
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
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* TikTok Video Picker */}
      {tiktokConnected && user && (
        <div>
          <VideoSelector
            selectedId={selectedVideoId}
            onSelect={(video) => {
              setUrl(video.share_url)
              setSelectedVideoId(video.id)
              setPreview({
                title: video.title,
                author_name: null,
                thumbnail_url: video.cover_image_url,
              })
              setPreviewError('')
            }}
          />
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">oder Link einfügen</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>
      )}

      {/* URL input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          TikTok-Video-Link <span className="text-brand-500">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError('') }}
          placeholder="https://www.tiktok.com/@username/video/1234567890"
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
        />
        {hashtag && (
          <p className="text-gray-500 text-xs mt-1">
            ⚠️ Dein Video muss den Hashtag <span className="text-brand-500 font-medium">{hashtag}</span> enthalten.
          </p>
        )}
      </div>

      {/* Preview */}
      {previewLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-brand-500 rounded-full animate-spin" />
          Lade Vorschau...
        </div>
      )}

      {preview && !previewLoading && (
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          {preview.thumbnail_url && (
            <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black">
              <Image
                src={preview.thumbnail_url}
                alt="Video preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{preview.title ?? 'TikTok Video'}</p>
            <p className="text-gray-400 text-xs">{preview.author_name ?? ''}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-green-400 text-xs">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Gültiger TikTok-Link
            </span>
          </div>
        </div>
      )}

      {previewError && !previewLoading && url && (
        <p className="text-yellow-400/70 text-xs">{previewError}</p>
      )}

      {/* Owner checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => setIsOwner(!isOwner)}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            isOwner ? 'bg-brand-500 border-brand-500' : 'border-gray-600 group-hover:border-gray-400'
          }`}
        >
          {isOwner && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-gray-300 text-sm leading-relaxed" onClick={() => setIsOwner(!isOwner)}>
          Ich bestätige, dass ich der Ersteller dieses Videos bin und die Rechte daran besitze. Das Video enthält den Pflicht-Hashtag.
        </span>
      </label>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url || !isOwner}
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
    </form>
  )
}
