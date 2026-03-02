import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ContestCard from '@/components/dashboard/ContestCard'
import TikTokConnect from '@/components/dashboard/TikTokConnect'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tiktok_username')
    .eq('id', user!.id)
    .single()

  const { data: contests } = await supabase
    .from('contests')
    .select('*')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: contests?.length ?? 0,
    active: contests?.filter(c => c.status === 'active').length ?? 0,
    draft: contests?.filter(c => c.status === 'draft').length ?? 0,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Verwalte deine Contests</p>
        </div>
        <div className="flex items-center gap-3">
          <TikTokConnect tiktokUsername={profile?.tiktok_username ?? null} />
          <Link
            href="/dashboard/contests/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-500/90 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neuer Contest
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Gesamt</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Aktiv</p>
          <p className="text-3xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Entwurf</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.draft}</p>
        </div>
      </div>

      {/* Contest List */}
      {contests && contests.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Deine Contests</h2>
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Noch keine Contests</h3>
          <p className="text-gray-500 text-sm mb-6">Erstelle deinen ersten Contest und lass die Community lostiktoker!</p>
          <Link
            href="/dashboard/contests/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-500/90 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ersten Contest erstellen
          </Link>
        </div>
      )}
    </div>
  )
}
