import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ContestActions from '@/components/dashboard/ContestActions'

const statusConfig = {
  draft: { label: 'Entwurf', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  active: { label: 'Aktiv', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  ended: { label: 'Beendet', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

const platformLabels: Record<string, string> = {
  tiktok: '🎵 TikTok',
  instagram: '📸 Instagram',
  youtube: '▶️ YouTube',
}

export default async function ContestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .single()

  if (!contest) notFound()

  const { data: entries, count: entryCount } = await supabase
    .from('entries')
    .select('*', { count: 'exact' })
    .eq('contest_id', contest.id)

  const status = statusConfig[contest.status as keyof typeof statusConfig] ?? statusConfig.draft
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clipcontest.vercel.app'}/c/${contest.id}`

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-300">{contest.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{platformLabels[contest.platform] ?? contest.platform}</p>
        </div>
        <ContestActions contestId={contest.id} currentStatus={contest.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Einreichungen</p>
          <p className="text-3xl font-bold text-white">{entryCount ?? 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Preisgeld</p>
          <p className="text-3xl font-bold text-white">€{Number(contest.prize ?? 0).toFixed(0)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Max. Entries</p>
          <p className="text-3xl font-bold text-white">{contest.max_entries}</p>
        </div>
      </div>

      {/* Share Link */}
      <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-5 mb-8">
        <p className="text-sm font-medium text-gray-300 mb-2">📎 Teilnahme-Link</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-brand-500 text-sm bg-black/20 px-3 py-2 rounded-lg truncate">
            {shareUrl}
          </code>
          <button
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
            className="px-3 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-500 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
          >
            Kopieren
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Details</h2>

        {contest.description && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Beschreibung</p>
            <p className="text-gray-300 text-sm">{contest.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {contest.start_date && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Startdatum</p>
              <p className="text-gray-300 text-sm">{new Date(contest.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
          {contest.end_date && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Enddatum</p>
              <p className="text-gray-300 text-sm">{new Date(contest.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          )}
          {contest.hashtag && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Hashtag</p>
              <p className="text-brand-500 text-sm font-medium">{contest.hashtag}</p>
            </div>
          )}
        </div>

        {contest.rules && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Regeln</p>
            <p className="text-gray-300 text-sm whitespace-pre-line">{contest.rules}</p>
          </div>
        )}
      </div>

      {/* Entries (placeholder for Phase 3) */}
      {entries && entries.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-white font-semibold mb-4">Einreichungen</h2>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium truncate">{entry.video_url}</p>
                  <p className="text-gray-500 text-xs">{new Date(entry.created_at).toLocaleDateString('de-DE')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  entry.status === 'approved' ? 'text-green-400 bg-green-400/10' :
                  entry.status === 'rejected' ? 'text-red-400 bg-red-400/10' :
                  'text-yellow-400 bg-yellow-400/10'
                }`}>
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-8 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500 text-sm">Noch keine Einreichungen — teile den Link!</p>
        </div>
      )}
    </div>
  )
}
