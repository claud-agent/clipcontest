'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type UserProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  tiktok_username: string | null
  tiktok_avatar: string | null
  created_at: string
  contest_count: number
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'text-red-400 bg-red-400/10 border-red-400/20',
  creator: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  participant: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const updateRole = async (id: string, role: string) => {
    setUpdating(id)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    setUpdating(null)
    fetchUsers()
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Users</h1>
        <span className="text-gray-500 text-sm">{users.length} User gesamt</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">Keine User gefunden.</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_120px_80px_80px_80px_140px] gap-3 px-5 py-3 border-b border-white/[0.06] text-gray-500 text-[11px] font-medium uppercase tracking-wider items-center">
            <span></span>
            <span>Name / E-Mail</span>
            <span>TikTok</span>
            <span>Rolle</span>
            <span>Contests</span>
            <span>Seit</span>
            <span>Aktionen</span>
          </div>

          {/* Rows */}
          {users.map(user => {
            const roleClass = ROLE_STYLES[user.role ?? 'creator'] ?? ROLE_STYLES.creator
            return (
              <div
                key={user.id}
                className="grid grid-cols-[40px_1fr_120px_80px_80px_80px_140px] gap-3 px-5 py-3.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                  {user.tiktok_avatar ? (
                    <Image
                      src={user.tiktok_avatar}
                      alt=""
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                      {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.full_name ?? 'Kein Name'}</p>
                  <p className="text-gray-600 text-xs truncate">{user.email}</p>
                </div>
                <span className="text-gray-400 text-xs truncate">
                  {user.tiktok_username ? `@${user.tiktok_username}` : '—'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium w-fit ${roleClass}`}>
                  {user.role ?? 'creator'}
                </span>
                <span className="text-gray-400 text-sm">{user.contest_count}</span>
                <span className="text-gray-500 text-xs">{formatDate(user.created_at)}</span>
                <div className="flex items-center gap-1">
                  <select
                    value={user.role ?? 'creator'}
                    onChange={e => updateRole(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-md text-white text-xs px-2 py-1.5 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="creator">Creator</option>
                    <option value="participant">Participant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
