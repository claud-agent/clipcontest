import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EntryForm from '@/components/contest/EntryForm'
import Leaderboard from '@/components/contest/Leaderboard'

export default async function PublicContestPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', params.id)
    .eq('is_public', true)
    .single()

  if (!contest) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Check TikTok connection
  let tiktokConnected = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tiktok_access_token')
      .eq('id', user.id)
      .single()
    tiktokConnected = !!profile?.tiktok_access_token
  }

  // Check if user already submitted
  let hasSubmitted = false
  if (user) {
    const { data: existing } = await supabase
      .from('entries')
      .select('id')
      .eq('contest_id', contest.id)
      .eq('user_id', user.id)
      .single()
    hasSubmitted = !!existing
  }

  const { count: entryCount } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contest.id)

  const isActive = contest.status === 'active'
  const isEnded = contest.status === 'ended'
  const prizeSplit: number[] = contest.prize_split ?? []
  const totalPrize = prizeSplit.reduce((a: number, b: number) => a + b, 0) || contest.prize || 0

  const daysLeft = contest.end_date
    ? Math.max(0, Math.ceil((new Date(contest.end_date).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">ClipContest</span>
          </Link>
          {!user && (
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Anmelden
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Status badge */}
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            isActive ? 'text-green-400 bg-green-400/10 border-green-400/20' :
            isEnded ? 'text-gray-400 bg-gray-400/10 border-gray-400/20' :
            'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
          }`}>
            {isActive ? '🟢 Aktiv' : isEnded ? '⚫ Beendet' : '⏳ Bald'}
          </span>
          <span className="text-gray-500 text-xs">🎵 TikTok</span>
          {daysLeft !== null && isActive && (
            <span className="text-gray-500 text-xs">⏱ noch {daysLeft} Tag{daysLeft !== 1 ? 'e' : ''}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">{contest.title}</h1>
        {contest.description && (
          <p className="text-gray-400 mb-6">{contest.description}</p>
        )}

        {/* Prize cards */}
        {prizeSplit.length > 0 ? (
          <div className={`grid gap-3 mb-8 ${prizeSplit.length === 1 ? 'grid-cols-1' : prizeSplit.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {prizeSplit.slice(0, contest.winner_count ?? 1).map((amount: number, i: number) => (
              <div key={i} className={`rounded-xl p-4 text-center border ${
                i === 0 ? 'bg-yellow-400/10 border-yellow-400/20' :
                i === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                'bg-orange-400/10 border-orange-400/20'
              }`}>
                <div className="text-2xl mb-1">{['🥇','🥈','🥉'][i]}</div>
                <div className={`text-xl font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-orange-400'}`}>
                  €{amount}
                </div>
                <div className="text-gray-500 text-xs">{i + 1}. Platz</div>
              </div>
            ))}
          </div>
        ) : totalPrize > 0 ? (
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 text-center mb-8">
            <div className="text-3xl font-bold text-yellow-400">€{totalPrize}</div>
            <div className="text-gray-400 text-sm">Gesamtpreisgeld</div>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">{entryCount ?? 0}</div>
            <div className="text-gray-500 text-xs">Einreichungen</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">
              {contest.participation_hashtag ?? '#—'}
            </div>
            <div className="text-gray-500 text-xs">Pflicht-Hashtag</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white">
              {contest.end_date
                ? new Date(contest.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                : '—'}
            </div>
            <div className="text-gray-500 text-xs">Deadline</div>
          </div>
        </div>

        {/* Entry form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-1">Jetzt teilnehmen</h2>
          <p className="text-gray-400 text-sm mb-4">
            Erstelle dein Video auf TikTok mit {contest.participation_hashtag ?? 'dem Pflicht-Hashtag'}
            {contest.participation_tag ? ` und tagge @${contest.participation_tag}` : ''}, dann reiche den Link hier ein.
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

        {/* Leaderboard */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <Leaderboard contestId={contest.id} />
        </div>

        {/* Rules / Terms */}
        {contest.terms && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">📋 Teilnahmebedingungen</h2>
            <pre className="text-gray-400 text-xs whitespace-pre-wrap font-sans leading-relaxed">
              {contest.terms}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}
