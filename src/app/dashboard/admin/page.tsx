'use client'

import { useState, useEffect } from 'react'

type Stats = {
  totalUsers: number
  activeContests: number
  totalContests: number
  totalEntries: number
  pendingEntries: number
  entriesToday: number
  entriesByDay: Record<string, number>
  latestEntries: {
    id: string
    video_title: string | null
    status: string
    submitted_at: string
    contest_id: string
  }[]
  latestUsers: {
    id: string
    full_name: string | null
    email: string | null
    role: string | null
    tiktok_username: string | null
    created_at: string
  }[]
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function timeSince(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'gerade eben'
  if (s < 3600) return `vor ${Math.floor(s / 60)} Min.`
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std.`
  return `vor ${Math.floor(s / 86400)} Tag${Math.floor(s / 86400) !== 1 ? 'en' : ''}`
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  approved: 'text-green-400 bg-green-400/10 border-green-400/20',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)

  const triggerMetrics = async () => {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const res = await fetch('/api/admin/trigger-metrics', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setTriggerResult(`Fehler: ${data.error}`)
      } else {
        setTriggerResult(`✅ Fertig — ${data.fetched ?? 0} Videos aktualisiert, ${data.scored ?? 0} gescored`)
      }
    } catch {
      setTriggerResult('Fehler beim Aufruf')
    } finally {
      setTriggering(false)
    }
  }

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}
          </div>
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!stats) return null

  const dayEntries = Object.entries(stats.entriesByDay)
  const maxEntries = Math.max(...dayEntries.map(([,v]) => v), 1)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Admin Overview</h1>
        <div className="flex items-center gap-3">
          {triggerResult && (
            <span className="text-xs text-gray-400">{triggerResult}</span>
          )}
          <button
            onClick={triggerMetrics}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-500 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {triggering ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                Läuft...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Metrics aktualisieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Users" value={stats.totalUsers} color="text-white" />
        <StatCard label="Aktive Contests" value={stats.activeContests} sub={`${stats.totalContests} gesamt`} color="text-green-400" />
        <StatCard label="Einreichungen" value={stats.totalEntries} sub={`${stats.entriesToday} heute`} color="text-brand-500" />
        <StatCard label="Pending" value={stats.pendingEntries} sub="warten auf Review" color="text-yellow-400" />
      </div>

      {/* Entries Chart (last 30 days) */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-white mb-4">Einreichungen — letzte 30 Tage</h2>
        <div className="flex items-end gap-[3px] h-32">
          {dayEntries.map(([day, count]) => (
            <div
              key={day}
              className="flex-1 group relative"
            >
              <div
                className="bg-brand-500/60 hover:bg-brand-500 rounded-t transition-colors w-full"
                style={{ height: `${Math.max((count / maxEntries) * 100, 2)}%` }}
              />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-white/10 backdrop-blur-xl text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                {day.slice(5)}: {count}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-gray-600 text-[10px]">{dayEntries[0]?.[0]?.slice(5)}</span>
          <span className="text-gray-600 text-[10px]">Heute</span>
        </div>
      </div>

      {/* Two columns: Latest Entries + Latest Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Entries */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Neueste Einreichungen</h2>
          <div className="space-y-2">
            {stats.latestEntries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.video_title ?? 'TikTok Video'}</p>
                  <p className="text-gray-600 text-xs">{timeSince(entry.submitted_at)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${STATUS_COLORS[entry.status] ?? 'text-gray-400'}`}>
                  {entry.status}
                </span>
              </div>
            ))}
            {stats.latestEntries.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">Noch keine Einreichungen</p>
            )}
          </div>
        </div>

        {/* Latest Users */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Neueste User</h2>
          <div className="space-y-2">
            {stats.latestUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 text-xs font-bold">
                    {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{user.full_name ?? user.email ?? 'User'}</p>
                  <p className="text-gray-600 text-xs">
                    {user.tiktok_username ? `@${user.tiktok_username}` : 'Kein TikTok'} · {timeSince(user.created_at)}
                  </p>
                </div>
                {user.role === 'admin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-400/10 text-red-400 border border-red-400/20 font-medium">
                    admin
                  </span>
                )}
              </div>
            ))}
            {stats.latestUsers.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">Noch keine User</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
