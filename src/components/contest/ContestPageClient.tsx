'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import EntryForm from './EntryForm'
import type { User } from '@supabase/supabase-js'

/* ───────── types ───────── */
type Tab = 'top' | 'new' | 'hot'

type ClipEntry = {
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
  submitted_at?: string
}

type ContestData = {
  id: string
  title: string
  description: string | null
  status: string
  end_date: string | null
  prize: number
  prize_split: number[]
  prize_type: string | null
  prize_description: string | null
  winner_count: number | null
  participation_hashtag: string | null
  participation_tag: string | null
  terms: string | null
  is_public: boolean
}

type CreatorData = {
  full_name: string | null
  tiktok_username: string | null
  tiktok_avatar: string | null
  email: string | null
}

type Props = {
  contest: ContestData
  creator: CreatorData
  entryCount: number
  user: User | null
  tiktokConnected: boolean
  hasSubmitted: boolean
}

/* ───────── helpers ───────── */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('de-DE')
}

function timeSince(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'gerade eben'
  if (s < 3600) return `vor ${Math.floor(s / 60)} Min.`
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std.`
  return `vor ${Math.floor(s / 86400)} Tag${Math.floor(s / 86400) !== 1 ? 'en' : ''}`
}

const TAB_CONFIG: { key: Tab; label: string; mode: string }[] = [
  { key: 'top', label: 'Top-Clips', mode: 'views' },
  { key: 'new', label: 'Neue Einreichungen', mode: 'views' },
  { key: 'hot', label: 'Hot', mode: 'score' },
]

const RANK_BADGES: Record<number, { emoji: string; color: string }> = {
  0: { emoji: '🏆', color: 'text-yellow-400' },
  1: { emoji: '⭐', color: 'text-gray-300' },
  2: { emoji: '🔥', color: 'text-orange-400' },
}

/* ───────── countdown hook ───────── */
function useCountdown(endDate: string | null) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false })

  useEffect(() => {
    if (!endDate) return
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true })
        return
      }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        ended: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endDate])

  return time
}

/* ═══════════════════════════════════════════ */
/*            MAIN COMPONENT                  */
/* ═══════════════════════════════════════════ */
export default function ContestPageClient({ contest, creator, entryCount, user, tiktokConnected, hasSubmitted }: Props) {
  const [tab, setTab] = useState<Tab>('top')
  const [entries, setEntries] = useState<ClipEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showEntry, setShowEntry] = useState(false)
  const countdown = useCountdown(contest.end_date)

  const isActive = contest.status === 'active'
  const isEnded = contest.status === 'ended'
  const prizeSplit: number[] = contest.prize_split ?? []
  const totalPrize = prizeSplit.reduce((a, b) => a + b, 0) || contest.prize || 0

  const creatorName = creator.full_name || creator.tiktok_username || 'Creator'
  const creatorAvatar = creator.tiktok_avatar

  /* ─── fetch clips ─── */
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const mode = tab === 'hot' ? 'score' : 'views'
      const res = await fetch(`/api/contests/${contest.id}/leaderboard?mode=${mode}`)
      if (!res.ok) return
      const data = await res.json()
      let list: ClipEntry[] = data.entries ?? []

      // For "new" tab sort by submitted_at descending
      if (tab === 'new') {
        list = [...list].sort((a, b) => {
          const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
          const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
          return tb - ta
        })
      }

      setEntries(list)
    } finally {
      setLoading(false)
    }
  }, [contest.id, tab])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchEntries, 30_000)
    return () => clearInterval(id)
  }, [fetchEntries])

  /* ─── countdown block helper ─── */
  const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0d0f]">

      {/* ═══ HEADER / BANNER ═══ */}
      <div className="relative">
        {/* Banner gradient */}
        <div className="h-40 sm:h-52 bg-gradient-to-br from-brand-500/30 via-purple-600/20 to-[#0c0d0f] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cuc3ZnLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
          {/* Floating decorative elements */}
          <div className="absolute top-6 right-10 text-4xl opacity-20 animate-pulse">🏆</div>
          <div className="absolute bottom-8 right-24 text-2xl opacity-10">🎬</div>
        </div>

        {/* Creator info overlaid on banner bottom */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
          <div className="flex items-end gap-4 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {creatorAvatar ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[#0c0d0f] bg-white/10">
                  <Image
                    src={creatorAvatar}
                    alt={creatorName}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#0c0d0f] bg-brand-500/20 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">🎬</span>
                </div>
              )}
              {/* Online indicator */}
              {isActive && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0c0d0f]" />
              )}
            </div>

            {/* Name + meta */}
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{creatorName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {creator.tiktok_username && (
                  <span className="text-gray-400 text-sm">@{creator.tiktok_username}</span>
                )}
                <span className="text-gray-600 text-sm">{entryCount} Einreichung{entryCount !== 1 ? 'en' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTEST INFO BAR ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Contest title + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-green-400 bg-green-400/10 border border-green-400/20' :
                  isEnded ? 'text-gray-400 bg-gray-400/10 border border-gray-400/20' :
                  'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                }`}>
                  {isActive ? 'Live' : isEnded ? 'Beendet' : 'Bald'}
                </span>
                {contest.participation_hashtag && (
                  <span className="text-brand-500 text-sm font-medium">{contest.participation_hashtag}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{contest.title}</h2>
              {contest.description && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{contest.description}</p>
              )}
            </div>

            {/* Right: Prize display */}
            <div className="flex-shrink-0 text-center sm:text-right">
              <div className="text-sm text-gray-500 mb-0.5">Preisgeld</div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                &euro;{totalPrize.toLocaleString('de-DE')}
              </div>
              {prizeSplit.length > 1 && (
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-end">
                  {prizeSplit.slice(0, 3).map((amount, i) => (
                    <span key={i} className="text-xs text-gray-500">
                      {['🥇','🥈','🥉'][i]} &euro;{amount}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Countdown */}
          {contest.end_date && isActive && !countdown.ended && (
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <CountdownBlock value={countdown.days} label="Tage" />
                <span className="text-gray-600 text-xl font-light">:</span>
                <CountdownBlock value={countdown.hours} label="Std" />
                <span className="text-gray-600 text-xl font-light">:</span>
                <CountdownBlock value={countdown.minutes} label="Min" />
                <span className="text-gray-600 text-xl font-light">:</span>
                <CountdownBlock value={countdown.seconds} label="Sek" />
              </div>
              <p className="text-center text-gray-600 text-xs mt-2">Einreichungsfrist</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ PARTICIPATE BUTTON ═══ */}
      {isActive && !hasSubmitted && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <button
            onClick={() => setShowEntry(!showEntry)}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-500/90 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Jetzt teilnehmen
          </button>

          {/* Entry form (collapsible) */}
          <div className={`overflow-hidden transition-all duration-500 ${showEntry ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-4">
                Erstelle dein Video auf TikTok mit <span className="text-brand-500 font-medium">{contest.participation_hashtag ?? 'dem Pflicht-Hashtag'}</span>
                {contest.participation_tag ? ` und tagge @${contest.participation_tag}` : ''}, dann wähle es hier aus.
              </p>
              <EntryForm
                contestId={contest.id}
                isActive={isActive}
                hasSubmitted={hasSubmitted}
                user={user}
                hashtag={contest.participation_hashtag}
                tiktokConnected={tiktokConnected}
              />
            </div>
          </div>
        </div>
      )}

      {/* Already submitted badge */}
      {hasSubmitted && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/[0.06] border border-green-500/20 rounded-xl">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-green-400 font-semibold text-sm">Du nimmst teil!</p>
              <p className="text-gray-500 text-xs">Dein Video ist im Rennen. Viel Erfolg!</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex items-center gap-1 border-b border-white/[0.06]">
          {TAB_CONFIG.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
              {/* Active underline */}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-500 rounded-full" />
              )}
            </button>
          ))}

          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 pr-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </div>
        </div>
      </div>

      {/* ═══ CLIP TILES ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 p-4 animate-pulse">
                <div className="w-40 sm:w-44 h-24 rounded-xl bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-gray-400 text-sm">Noch keine Clips eingereicht.</p>
            <p className="text-gray-600 text-xs mt-1">Sei der Erste!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <a
                key={entry.id}
                href={entry.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 p-3 rounded-xl transition-all hover:bg-white/[0.03] group"
              >
                {/* Rank number */}
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                  {i < 3 ? (
                    <span className={`text-lg ${RANK_BADGES[i].color}`}>{RANK_BADGES[i].emoji}</span>
                  ) : (
                    <span className="text-gray-600 text-sm font-bold tabular-nums">{i + 1}</span>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="relative w-40 sm:w-44 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                  {entry.thumbnail_url ? (
                    <Image
                      src={entry.thumbnail_url}
                      alt={entry.video_title ?? 'Video'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>
                  )}
                  {/* Duration-style overlay badge for rank */}
                  {i < 3 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      #{i + 1}
                    </div>
                  )}
                  {/* Play icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start gap-2">
                    <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-brand-500 transition-colors leading-snug">
                      {entry.video_title ?? 'TikTok Video'}
                      {entry.anomaly && <span className="ml-1 text-yellow-400" title="Ungewöhnlich">⚠️</span>}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5 truncate">
                    {entry.author_name ?? 'TikTok User'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {formatCount(entry.view_count)} Views
                    </span>
                    {entry.like_count > 0 && (
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        {formatCount(entry.like_count)}
                      </span>
                    )}
                    {entry.comment_count > 0 && (
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                        </svg>
                        {formatCount(entry.comment_count)}
                      </span>
                    )}
                    {entry.submitted_at && tab === 'new' && (
                      <span className="text-gray-600 text-xs">{timeSince(entry.submitted_at)}</span>
                    )}
                  </div>

                  {/* Hot indicator for top 3 in "hot" tab */}
                  {tab === 'hot' && i < 3 && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                        🔥 Trending
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Primary metric */}
                <div className="flex-shrink-0 text-right self-center">
                  <p className="text-white text-sm font-bold tabular-nums">
                    {formatCount(tab === 'hot' ? entry.score : entry.view_count)}
                  </p>
                  <p className="text-gray-600 text-[10px]">{tab === 'hot' ? 'Score' : 'Views'}</p>
                  {entry.growth > 0 && (
                    <p className="text-green-400 text-[10px] tabular-nums mt-0.5">
                      +{formatCount(entry.growth)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TERMS (collapsible at bottom) ═══ */}
      {contest.terms && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
          <details className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <summary className="px-5 py-4 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
              Teilnahmebedingungen anzeigen
            </summary>
            <div className="px-5 pb-5">
              <pre className="text-gray-500 text-[12px] whitespace-pre-wrap font-sans leading-relaxed">
                {contest.terms}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* ═══ NOT LOGGED IN floating bar ═══ */}
      {!user && isActive && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0c0d0f]/90 backdrop-blur-xl border-t border-white/[0.06] py-3 px-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-gray-400 text-sm">Melde dich an, um teilzunehmen.</p>
            <a
              href={`/auth/login?next=/c/${contest.id}`}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-500/90 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Anmelden & teilnehmen
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
