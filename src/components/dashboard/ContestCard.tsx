import Link from 'next/link'

type Contest = {
  id: string
  title: string
  platform: string
  status: string
  prize: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

const statusConfig = {
  draft: { label: 'Entwurf', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  active: { label: 'Aktiv', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  ended: { label: 'Beendet', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

const platformIcons: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  youtube: '▶️',
}

export default function ContestCard({ contest }: { contest: Contest }) {
  const status = statusConfig[contest.status as keyof typeof statusConfig] ?? statusConfig.draft

  return (
    <Link href={`/dashboard/contests/${contest.id}`}>
      <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all hover:bg-white/[0.07] group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{platformIcons[contest.platform] ?? '📱'}</span>
              <h3 className="text-white font-semibold truncate group-hover:text-brand-500 transition-colors">
                {contest.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {contest.end_date && (
                <span>Endet: {new Date(contest.end_date).toLocaleDateString('de-DE')}</span>
              )}
              {contest.prize > 0 && (
                <span>💰 €{contest.prize.toFixed(0)} Preisgeld</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
              {status.label}
            </span>
            <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
