import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ContestPageClient from '@/components/contest/ContestPageClient'

export default async function PublicContestPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch contest
  const { data: contest } = await supabase
    .from('contests')
    .select('*')
    .eq('id', params.id)
    .eq('is_public', true)
    .single()

  if (!contest) notFound()

  // Fetch creator profile
  const { data: creator } = await supabase
    .from('profiles')
    .select('full_name, tiktok_username, tiktok_avatar, email')
    .eq('id', contest.creator_id)
    .single()

  // Check auth
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

  return (
    <ContestPageClient
      contest={{
        id: contest.id,
        title: contest.title,
        description: contest.description,
        status: contest.status,
        end_date: contest.end_date,
        prize: contest.prize ?? 0,
        prize_split: contest.prize_split ?? [],
        prize_type: contest.prize_type ?? null,
        prize_description: contest.prize_description ?? null,
        winner_count: contest.winner_count ?? null,
        participation_hashtag: contest.participation_hashtag ?? null,
        participation_tag: contest.participation_tag ?? null,
        terms: contest.terms ?? null,
        is_public: contest.is_public,
      }}
      creator={{
        full_name: creator?.full_name ?? null,
        tiktok_username: creator?.tiktok_username ?? null,
        tiktok_avatar: creator?.tiktok_avatar ?? null,
        email: creator?.email ?? null,
      }}
      entryCount={entryCount ?? 0}
      user={user}
      tiktokConnected={tiktokConnected}
      hasSubmitted={hasSubmitted}
    />
  )
}
