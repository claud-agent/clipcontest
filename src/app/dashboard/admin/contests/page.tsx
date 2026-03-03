'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Contest = {
  id: string
  title: string
  status: string
  prize: number
  creator_id: string
  creator_name: string
  entry_count: number
  created_at: string
  end_date: string | null
  participation_hashtag: string | null
}

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  draft: { label: 'Entwurf', class: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
  active: { label: 'Aktiv', class: 'text-green-400 bg-green-400/10 border-green-400/20' },
  ended: { label: 'Beendet', class: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const FILTERS = ['all', 'active', 'draft', 'ended'] as const

export default function AdminContests() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchContests = () => {
    setLoading(true)
    fetch(`/api/admin/contests?status=${filter}`)
      .then(r => r.json())
      .then(d => setContests(d.contests ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchContests() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await fetch('/api/admin/contests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setUpdating(null)
    fetchContests()
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Contests</h1>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === f
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'Alle' : STATUS_STYLES[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">Keine Contests gefunden.</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_80px_80px_80px_140px] gap-4 px-5 py-3 border-b border-white/[0.06] text-gray-500 text-[11px] font-medium uppercase tracking-wider">
            <span>Titel</span>
            <span>Creator</span>
            <span>Status</span>
            <span>Preis</span>
            <span>Entries</span>
            <span>Aktionen</span>
          </div>

          {/* Rows */}
          {contests.map(contest => {
            const st = STATUS_STYLES[contest.status] ?? STATUS_STYLES.draft
            return (
              <div
                key={contest.id}
                className="grid grid-cols-[1fr_120px_80px_80px_80px_140px] gap-4 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="min-w-0">
                  <Link href={`/c/${contest.id}`} className="text-white text-sm font-medium hover:text-brand-500 transition-colors truncate block">
                    {contest.title}
                  </Link>
                  {contest.participation_hashtag && (
                    <span className="text-gray-600 text-xs">{contest.participation_hashtag}</span>
                  )}
                </div>
                <span className="text-gray-400 text-xs truncate">{contest.creator_name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium w-fit ${st.class}`}>
                  {st.label}
                </span>
                <span className="text-white text-sm font-medium">&euro;{contest.prize}</span>
                <span className="text-gray-400 text-sm">{contest.entry_count}</span>
                <div className="flex items-center gap-1">
                  {contest.status !== 'active' && (
                    <button
                      onClick={() => updateStatus(contest.id, 'active')}
                      disabled={updating === contest.id}
                      className="px-2 py-1 text-[10px] font-medium rounded-md bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                    >
                      Aktivieren
                    </button>
                  )}
                  {contest.status === 'active' && (
                    <button
                      onClick={() => updateStatus(contest.id, 'ended')}
                      disabled={updating === contest.id}
                      className="px-2 py-1 text-[10px] font-medium rounded-md bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                    >
                      Beenden
                    </button>
                  )}
                  {contest.status === 'ended' && (
                    <button
                      onClick={() => updateStatus(contest.id, 'draft')}
                      disabled={updating === contest.id}
                      className="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-400/10 text-gray-400 border border-gray-400/20 hover:bg-gray-400/20 transition-colors disabled:opacity-50"
                    >
                      Entwurf
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
