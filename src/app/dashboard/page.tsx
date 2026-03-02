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
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-[13px] mt-0.5">Verwalte deine Contests</p>
        </div>
        <div className="flex items-center gap-3">
          <TikTokConnect tiktokUsername={profile?.tiktok_username ?? null} />
          <Link
            href="/dashboard/contests/new"
            className="flex items-center gap-2 h-9 px-4 bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-lg transition-all duration-200 text-[13px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Neuer Contest
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Gesamt', value: stats.total, color: 'text-white' },
          { label: 'Aktiv', value: stats.active, color: 'text-green-400' },
          { label: 'Entwurf', value: stats.draft, color: 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Contest List */}
      {contests && contests.length > 0 ? (
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Deine Contests</h2>
          <div className="space-y-2">
            {contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-2xl">
          <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-[15px] mb-1.5">Noch keine Contests</h3>
          <p className="text-gray-500 text-[13px] mb-6">Erstelle deinen ersten Contest.</p>
          <Link
            href="/dashboard/contests/new"
            className="inline-flex items-center gap-2 h-9 px-4 bg-brand-500 hover:bg-brand-400 text-white font-semibold rounded-lg transition-all duration-200 text-[13px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ersten Contest erstellen
          </Link>
        </div>
      )}
    </div>
  )
}
