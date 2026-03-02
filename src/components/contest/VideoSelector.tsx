'use client'

import { useState } from 'react'
import Image from 'next/image'

type TikTokVideo = {
  id: string
  title: string
  cover_image_url: string
  share_url: string
  view_count: number
  like_count: number
  create_time: number
}

type Props = {
  onSelect: (video: TikTokVideo) => void
  selectedId?: string
}

export default function VideoSelector({ onSelect, selectedId }: Props) {
  const [open, setOpen] = useState(false)
  const [videos, setVideos] = useState<TikTokVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')

  const fetchVideos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tiktok/videos')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setVideos(data.videos)
        setUsername(data.username)
        setOpen(true)
      }
    } catch {
      setError('Fehler beim Laden der Videos.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (video: TikTokVideo) => {
    onSelect(video)
    setOpen(false)
  }

  if (open) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300">
            🎵 @{username} — Wähle dein Video
          </p>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            Abbrechen
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Keine öffentlichen Videos gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleSelect(video)}
                className={`relative rounded-xl overflow-hidden aspect-[9/16] border-2 transition-all ${
                  selectedId === video.id
                    ? 'border-brand-500 ring-2 ring-brand-500/30'
                    : 'border-transparent hover:border-white/30'
                }`}
              >
                {video.cover_image_url ? (
                  <Image
                    src={video.cover_image_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-white text-xs truncate">{video.title || '—'}</p>
                  <p className="text-gray-400 text-xs">
                    {video.view_count?.toLocaleString('de-DE') ?? '—'} Views
                  </p>
                </div>
                {selectedId === video.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={fetchVideos}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-black/80 border border-white/20 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Lade Videos...
          </>
        ) : (
          <>
            <span className="text-lg">🎵</span>
            Video aus TikTok auswählen
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
