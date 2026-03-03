'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Entry = {
  id: string
  video_url: string
  video_title: string | null
  author_name: string | null
  thumbnail_url: string | null
  status: string
  submitted_at: string
  contest_id: string
  contest_title: string
  user_id: string
}

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  approved: { label: 'Approved', class: 'text-green-400 bg-green-400/10 border-green-400/20' },
  rejected: { label: 'Rejected', class: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const

export default function AdminEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState(false)

  const fetchEntries = () => {
    setLoading(true)
    fetch(`/api/admin/entries?status=${filter}`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries ?? [])
        setSelected(new Set())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEntries() }, [filter])

  const bulkUpdate = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return
    setUpdating(true)
    await fetch('/api/admin/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), status }),
    })
    setUpdating(false)
    fetchEntries()
  }

  const singleUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(true)
    await fetch('/api/admin/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], status }),
    })
    setUpdating(false)
    fetchEntries()
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set())
    else setSelected(new Set(entries.map(e => e.id)))
  }

  function timeSince(iso: string): string {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 3600) return `vor ${Math.floor(s / 60)} Min.`
    if (s < 86400) return `vor ${Math.floor(s / 3600)} Std.`
    return `vor ${Math.floor(s / 86400)}d`
  }

  const pendingCount = entries.filter(e => e.status === 'pending').length

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Einreichungen</h1>
          {pendingCount > 0 && filter === 'all' && (
            <p className="text-yellow-400 text-xs mt-1">{pendingCount} warten auf Review</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">{selected.size} ausgewählt</span>
              <button
                onClick={() => bulkUpdate('approved')}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors disabled:opacity-50"
              >
                Alle genehmigen
              </button>
              <button
                onClick={() => bulkUpdate('rejected')}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors disabled:opacity-50"
              >
                Alle ablehnen
              </button>
            </div>
          )}

          {/* Filter */}
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
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">Keine Einreichungen gefunden.</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_60px_1fr_140px_80px_80px_120px] gap-3 px-4 py-3 border-b border-white/[0.06] text-gray-500 text-[11px] font-medium uppercase tracking-wider items-center">
            <div>
              <input
                type="checkbox"
                checked={selected.size === entries.length && entries.length > 0}
                onChange={toggleAll}
                className="w-3.5 h-3.5 accent-brand-500 cursor-pointer"
              />
            </div>
            <span></span>
            <span>Video</span>
            <span>Contest</span>
            <span>Status</span>
            <span>Zeit</span>
            <span>Aktionen</span>
          </div>

          {/* Rows */}
          {entries.map(entry => {
            const st = STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending
            return (
              <div
                key={entry.id}
                className={`grid grid-cols-[40px_60px_1fr_140px_80px_80px_120px] gap-3 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center ${
                  selected.has(entry.id) ? 'bg-brand-500/[0.03]' : ''
                }`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={selected.has(entry.id)}
                    onChange={() => toggleSelect(entry.id)}
                    className="w-3.5 h-3.5 accent-brand-500 cursor-pointer"
                  />
                </div>
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {entry.thumbnail_url ? (
                    <Image
                      src={entry.thumbnail_url}
                      alt=""
                      width={56}
                      height={40}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">🎬</div>
                  )}
                </div>
                <div className="min-w-0">
                  <a href={entry.video_url} target="_blank" rel="noopener noreferrer" className="text-white text-sm hover:text-brand-500 transition-colors truncate block">
                    {entry.video_title ?? 'TikTok Video'}
                  </a>
                  <p className="text-gray-600 text-xs truncate">{entry.author_name ?? 'User'}</p>
                </div>
                <span className="text-gray-400 text-xs truncate">{entry.contest_title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium w-fit ${st.class}`}>
                  {st.label}
                </span>
                <span className="text-gray-500 text-xs">{timeSince(entry.submitted_at)}</span>
                <div className="flex items-center gap-1">
                  {entry.status !== 'approved' && (
                    <button
                      onClick={() => singleUpdate(entry.id, 'approved')}
                      disabled={updating}
                      className="p-1.5 rounded-md bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50"
                      title="Genehmigen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  {entry.status !== 'rejected' && (
                    <button
                      onClick={() => singleUpdate(entry.id, 'rejected')}
                      disabled={updating}
                      className="p-1.5 rounded-md bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      title="Ablehnen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
