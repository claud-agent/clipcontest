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

  let tiktokConnected = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tiktok_access_token')
      .eq('id', user.id)
      .single()
    tiktokConnected = !!profile?.tiktok_access_token
  }

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
    <div className="min-h-screen bg-[#0c0d0f]">
      {/* Header */}
      <header className="border-b border-white/[0.04] bg-[#0c0d0f]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-white">ClipContest</span>
          </Link>
          {!user && (
            <Link href="/auth/login" className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200">
              Anmelden
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Status badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
            isActive ? 'text-green-400 bg-green-400/[0.08] border-green-400/20' :
            isEnded ? 'text-gray-400 bg-gray-400/[0.08] border-gray-400/20' :
            'text-yellow-400 bg-yellow-400/[0.08] border-yellow-400/20'
          }`}>
            {isActive ? 'Aktiv' : isEnded ? 'Beendet' : 'Bald'}
          </span>
          <span className="text-gray-600 text-[11px]">TikTok</span>
          {daysLeft !== null && isActive && (
            <span className="text-gray-500 text-[11px]">noch {daysLeft} Tag{daysLeft !== 1 ? 'e' : ''}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">{contest.title}</h1>
        {contest.description && (
          <p className="text-gray-400 text-[15px] mb-8 leading-relaxed">{contest.description}</p>
        )}

        {/* Prize cards */}
        {prizeSplit.length > 0 ? (
          <div className={`grid gap-3 mb-8 ${prizeSplit.length === 1 ? 'grid-cols-1' : prizeSplit.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {prizeSplit.slice(0, contest.winner_count ?? 1).map((amount: number, i: number) => (
              <div key={i} className={`rounded-xl p-4 text-center border ${
                i === 0 ? 'bg-yellow-400/[0.06] border-yellow-400/15' :
                i === 1 ? 'bg-white/[0.02] border-white/[0.06]' :
                'bg-orange-400/[0.06] border-orange-400/15'
              }`}>
                <div className="text-xl mb-1">{['🥇','🥈','🥉'][i]}</div>
                <div className={`text-lg font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-orange-400'}`}>
                  &euro;{amount}
                </div>
                <div className="text-gray-600 text-[11px]">{i + 1}. Platz</div>
              </div>
            ))}
          </div>
        ) : totalPrize > 0 ? (
          <div className="bg-yellow-400/[0.06] border border-yellow-400/15 rounded-xl p-4 text-center mb-8">
            <div className="text-2xl font-bold text-yellow-400">&euro;{totalPrize}</div>
            <div className="text-gray-500 text-[13px]">Gesamtpreisgeld</div>
          </div>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { value: entryCount ?? 0, label: 'Einreichungen' },
            { value: contest.participation_hashtag ?? '#—', label: 'Hashtag' },
            { value: contest.end_date ? new Date(contest.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '—', label: 'Deadline' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-gray-600 text-[11px]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Entry form */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-[15px] mb-1">Jetzt teilnehmen</h2>
          <p className="text-gray-500 text-[13px] mb-4">
            Erstelle dein Video auf TikTok mit {contest.participation_hashtag ?? 'dem Pflicht-Hashtag'}
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

        {/* Leaderboard */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <Leaderboard contestId={contest.id} />
        </div>

        {/* Terms */}
        {contest.terms && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-white font-semibold text-[15px] mb-4">Teilnahmebedingungen</h2>
            <pre className="text-gray-500 text-[12px] whitespace-pre-wrap font-sans leading-relaxed">
              {contest.terms}
            </pre>
          </div>
        )}
      </main>
    </div>
  )
}
