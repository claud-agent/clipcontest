'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

type Mode = 'views' | 'growth' | 'score'

type LeaderboardEntry = {
  id: string
  video_url: string
  video_title: string | null
  author_name: string | null
  thumbnail_url: string | null
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  growth: number
  score: number
  anomaly: boolean
  updatedAt: string | null
}

const REFRESH_INTERVAL = 30_000 // 30 seconds

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('de-DE')
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min.`
  return `vor ${Math.floor(mins / 60)} Std.`
}

const MEDALS = ['🥇', '🥈', '🥉']

const MODE_LABELS: Record<Mode, string> = {
  views: '👁 Views',
  growth: '📈 Zuwachs',
  score: '🏆 Score',
}

const RANK_STYLES: Record<number, string> = {
  0: 'bg-yellow-500/8 border-yellow-500/25',
  1: 'bg-gray-400/5 border-gray-400/20',
  2: 'bg-orange-600/8 border-orange-500/20',
}

export default function Leaderboard({ contestId }: { contestId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [mode, setMode] = useState<Mode>('views')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${contestId}/leaderboard?mode=${mode}`)
      if (!res.ok) return
      const data = await res.json()
      setEntries(data.entries ?? [])
      setUpdatedAt(data.updatedAt ?? null)
      setCountdown(REFRESH_INTERVAL / 1000)
    } finally {
      setLoading(false)
    }
  }, [contestId, mode])

  // Fetch on mount + mode change
  useEffect(() => {
    setLoading(true)
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Leaderboard
          {/* Live dot */}
          <span className="flex items-center gap-1 text-xs font-normal text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            live
          </span>
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode selector */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Last updated */}
          <div className="text-xs text-gray-500 tabular-nums">
            {updatedAt ? (
              <span title={new Date(updatedAt).toLocaleTimeString('de-DE')}>
                ⏱ {timeAgo(updatedAt)} · Refresh in {countdown}s
              </span>
            ) : (
              <span>Refresh in {countdown}s</span>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[72px] bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          Noch keine genehmigten Einreichungen im Leaderboard.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <a
              key={entry.id}
              href={entry.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] hover:border-brand-500/40 group ${
                RANK_STYLES[i] ?? 'bg-white/3 border-white/8'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {MEDALS[i] ? (
                  <span className="text-xl">{MEDALS[i]}</span>
                ) : (
                  <span className="text-gray-500 text-sm font-bold">#{i + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              {entry.thumbnail_url ? (
                <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                  <Image
                    src={entry.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-10 h-14 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-gray-600 text-xs">
                  🎬
                </div>
              )}

              {/* Title + author */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-medium truncate">
                    {entry.video_title ?? 'TikTok Video'}
                  </p>
                  {entry.anomaly && (
                    <span title="Ungewöhnlicher Views-Anstieg" className="text-yellow-400 text-xs flex-shrink-0">⚠️</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs truncate">{entry.author_name ?? ''}</p>

                {/* Mini stats */}
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.like_count > 0 && (
                    <span className="text-gray-600 text-xs">❤️ {formatCount(entry.like_count)}</span>
                  )}
                  {entry.comment_count > 0 && (
                    <span className="text-gray-600 text-xs">💬 {formatCount(entry.comment_count)}</span>
                  )}
                  {entry.share_count > 0 && (
                    <span className="text-gray-600 text-xs">↗️ {formatCount(entry.share_count)}</span>
                  )}
                </div>
              </div>

              {/* Primary metric */}
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-bold tabular-nums">
                  {formatCount(mode === 'views' ? entry.view_count : mode === 'growth' ? entry.growth : entry.score)}
                </p>
                <p className="text-gray-500 text-xs">{MODE_LABELS[mode].split(' ')[1]}</p>
                {mode !== 'views' && entry.growth > 0 && (
                  <p className="text-green-400 text-xs tabular-nums">
                    +{formatCount(entry.growth)}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
