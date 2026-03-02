'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Entry = {
  id: string
  video_url: string
  platform_video_id: string | null
  status: string
  thumbnail_url: string | null
  video_title: string | null
  author_name: string | null
  is_owner_confirmed: boolean
  created_at: string
  user_id: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ausstehend', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  approved: { label: 'Zugelassen', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  rejected: { label: 'Abgelehnt', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const s = statusLabels[entry.status] ?? statusLabels.pending

  const updateStatus = async (status: 'approved' | 'rejected') => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('entries').update({ status }).eq('id', entry.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
      {/* Thumbnail */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
        {entry.thumbnail_url ? (
          <div className="relative w-full h-full">
            <Image src={entry.thumbnail_url} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-white text-sm font-medium truncate">
              {entry.video_title ?? 'TikTok Video'}
            </p>
            <p className="text-gray-500 text-xs">{entry.author_name ?? '—'}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${s.color}`}>
            {s.label}
          </span>
        </div>

        <a
          href={entry.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 text-xs hover:underline truncate block mb-2"
        >
          {entry.video_url}
        </a>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          {entry.is_owner_confirmed && (
            <span className="text-green-400/60">✓ Owner bestätigt</span>
          )}
          <span>{new Date(entry.created_at).toLocaleDateString('de-DE')}</span>
        </div>
      </div>

      {/* Actions */}
      {entry.status === 'pending' && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => updateStatus('approved')}
            disabled={loading}
            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            ✓ Zulassen
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            ✗ Ablehnen
          </button>
        </div>
      )}
      {entry.status === 'approved' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={loading}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Ablehnen
        </button>
      )}
      {entry.status === 'rejected' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Zulassen
        </button>
      )}
    </div>
  )
}
