'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type Platform = 'tiktok' | 'youtube' | 'instagram'
type ContentSource = 'recent' | 'timeline' | 'custom' | 'all' | 'upload' | 'link'
type WinnerMethod = 'engagement' | 'total_views' | 'jury'
type PrizeType = 'cash' | 'voucher' | 'custom'
type WinnerCount = 1 | 3

type WizardData = {
  platforms: Platform[]
  contentSource: ContentSource
  contentSourceData: Record<string, string>
  winnerMethods: WinnerMethod[]
  prizeType: PrizeType
  prizeAmount: number
  prizeDescription: string
  methodBudgetSplit: Record<string, number>
  winnerCount: WinnerCount
  prizeSplit: number[]
  startDate: string
  endDate: string
  hashtag: string
  tag: string
  title: string
}

const defaultData: WizardData = {
  platforms: [],
  contentSource: 'all',
  contentSourceData: {},
  winnerMethods: [],
  prizeType: 'cash',
  prizeAmount: 0,
  prizeDescription: '',
  methodBudgetSplit: {},
  winnerCount: 1,
  prizeSplit: [0],
  startDate: '',
  endDate: '',
  hashtag: '',
  tag: '',
  title: '',
}

// ─── Smooth Reveal Wrapper ──────────────────────────────────────────────────

function RevealSection({
  show,
  children,
  id,
}: {
  show: boolean
  children: React.ReactNode
  id: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  useEffect(() => {
    if (show && !hasScrolled.current && ref.current) {
      hasScrolled.current = true
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [show])

  return (
    <div
      ref={ref}
      id={id}
      className={`transition-all duration-500 ease-out ${
        show
          ? 'opacity-100 translate-y-0 max-h-[2000px]'
          : 'opacity-0 translate-y-4 max-h-0 overflow-hidden pointer-events-none'
      }`}
    >
      <div className="pt-8">{children}</div>
    </div>
  )
}

// ─── Selection Card ─────────────────────────────────────────────────────────

function SelectCard({
  selected,
  onClick,
  icon,
  label,
  desc,
  disabled,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  desc?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
        disabled
          ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
          : selected
          ? 'border-brand-500/50 bg-brand-500/[0.08]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
            selected ? 'border-brand-500 bg-brand-500' : 'border-gray-600'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className={`text-[14px] font-medium ${selected ? 'text-white' : disabled ? 'text-gray-500' : 'text-gray-200'}`}>
              {label}
            </span>
            {disabled && <span className="text-[11px] text-gray-600 ml-auto">Bald</span>}
          </div>
          {desc && <p className="text-[12px] text-gray-500 mt-0.5 ml-7">{desc}</p>}
        </div>
      </div>
    </button>
  )
}

// ─── Section Label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-white">{children}</h2>
    </div>
  )
}

// ─── Quick Button ───────────────────────────────────────────────────────────

function QuickButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
        selected
          ? 'bg-brand-500 text-white'
          : 'bg-white/[0.04] border border-white/[0.06] text-gray-300 hover:bg-white/[0.08]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Terms Generator ────────────────────────────────────────────────────────

function generateTerms(data: WizardData): string {
  const methods = data.winnerMethods.map(m =>
    m === 'engagement' ? 'Engagement (Views, Kommentare, Likes)'
    : m === 'total_views' ? 'Höchste Gesamt-Views'
    : 'Jury-Entscheidung'
  ).join(', ')

  const prizesText = data.prizeSplit
    .slice(0, data.winnerCount)
    .map((amount, i) => `   ${i + 1}. Platz: €${amount}`)
    .join('\n')

  const startDate = data.startDate
    ? new Date(data.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Sofort'
  const endDate = data.endDate
    ? new Date(data.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '[Enddatum]'

  return `TEILNAHMEBEDINGUNGEN – ${data.title || '[Contest Name]'}

Veranstalter: [Dein Name / Unternehmen]
Plattformen: ${data.platforms.map(p => p === 'tiktok' ? 'TikTok' : p === 'youtube' ? 'YouTube Shorts' : 'Instagram Reels').join(', ')}
Zeitraum: ${startDate} bis ${endDate}

TEILNAHME
• Erstelle ein Video und nutze den Hashtag ${data.hashtag || '#[Hashtag]'}${data.tag ? ` und tagge @${data.tag}` : ''}.
• Pro Person ist maximal 1 Einreichung erlaubt.
• Teilnahme ab 18 Jahren.
• Das eingereichte Video muss original und selbst erstellt sein.

GEWINNERAUSWAHL
Methode(n): ${methods}
${data.winnerMethods.includes('engagement') || data.winnerMethods.includes('total_views') ? 'Der Veranstalter behält sich vor, Einreichungen mit unnatürlichem Wachstum oder gekauften Views zu disqualifizieren.' : ''}

PREISE
${data.prizeType === 'cash' ? prizesText : data.prizeType === 'voucher' ? `Gutschein: ${data.prizeDescription}` : `Preis: ${data.prizeDescription}`}

SONSTIGES
• Dieser Contest steht in keiner Verbindung zu TikTok, Meta, YouTube oder deren Muttergesellschaften.
• Der Veranstalter behält sich vor, den Contest jederzeit zu beenden oder zu ändern.
• Die Teilnahme gilt als Zustimmung zu diesen Bedingungen.`
}

// ─── Main Wizard ────────────────────────────────────────────────────────────

export default function ContestWizard() {
  const router = useRouter()
  const [data, setData] = useState<WizardData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  // Toggle platform
  const togglePlatform = (p: Platform) => {
    const next = data.platforms.includes(p)
      ? data.platforms.filter(x => x !== p)
      : [...data.platforms, p]
    update({ platforms: next })
  }

  // Toggle winner method
  const toggleMethod = (m: WinnerMethod) => {
    const next = data.winnerMethods.includes(m)
      ? data.winnerMethods.filter(x => x !== m)
      : [...data.winnerMethods, m]
    update({ winnerMethods: next })
  }

  // Set end date from quick option
  const setQuickEnd = (days: number) => {
    const start = data.startDate ? new Date(data.startDate) : new Date()
    const end = new Date(start.getTime() + days * 86400000)
    update({ endDate: end.toISOString().split('T')[0] })
  }

  // Set today
  const setToday = () => {
    update({ startDate: new Date().toISOString().split('T')[0] })
  }

  // Visibility logic
  const showContentSource = data.platforms.length > 0
  const showWinnerMethod = showContentSource
  const showPrize = data.winnerMethods.length > 0
  const showWinnerCount = showPrize && data.prizeAmount > 0
  const showTimeframe = showWinnerCount
  const showHashtag = showTimeframe && !!data.endDate
  const showTitle = showHashtag && data.hashtag.length > 1
  const canConfirm = showTitle && data.title.trim().length > 0

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const terms = generateTerms(data)
    const totalPrize = data.prizeSplit.slice(0, data.winnerCount).reduce((a, b) => a + b, 0)

    const { data: contest, error: err } = await supabase
      .from('contests')
      .insert({
        creator_id: user.id,
        title: data.title,
        platform: data.platforms[0] || 'tiktok',
        upload_platforms: data.platforms,
        content_source: data.contentSource,
        content_source_data: data.contentSourceData,
        winner_methods: data.winnerMethods,
        winner_logic: data.winnerMethods.includes('jury') ? 'jury' : data.winnerMethods.includes('engagement') ? 'hybrid' : 'views',
        method_budget_split: data.methodBudgetSplit,
        prize_type: data.prizeType,
        prize_description: data.prizeDescription,
        start_date: data.startDate || new Date().toISOString(),
        end_date: data.endDate || null,
        update_frequency: 'daily',
        participation_hashtag: data.hashtag,
        participation_tag: data.tag || null,
        max_entries_per_person: 1,
        winner_count: data.winnerCount,
        prize_split: data.prizeSplit.slice(0, data.winnerCount),
        prize: totalPrize,
        terms,
        anti_manipulation: data.winnerMethods.includes('engagement') || data.winnerMethods.includes('total_views'),
        status: 'active',
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/contests/${contest.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl mx-auto">

      {/* ── Section 1: Platform ── */}
      <div>
        <SectionLabel>Wo sollen die Clips hochgeladen werden?</SectionLabel>
        <div className="space-y-2">
          <SelectCard
            selected={data.platforms.includes('tiktok')}
            onClick={() => togglePlatform('tiktok')}
            icon="🎵"
            label="TikTok"
            desc="Kurze Videos bis 10 Minuten"
          />
          <SelectCard
            selected={data.platforms.includes('youtube')}
            onClick={() => togglePlatform('youtube')}
            icon="▶️"
            label="YouTube Shorts"
            desc="Kurze Videos bis 60 Sekunden"
          />
          <SelectCard
            selected={data.platforms.includes('instagram')}
            onClick={() => togglePlatform('instagram')}
            icon="📸"
            label="Instagram Reels"
            desc="Kurze Videos bis 90 Sekunden"
          />
        </div>
      </div>

      {/* ── Section 2: Content Source ── */}
      <RevealSection show={showContentSource} id="content-source">
        <SectionLabel>Woher soll der Content stammen?</SectionLabel>
        <div className="space-y-2">
          <SelectCard
            selected={data.contentSource === 'all'}
            onClick={() => update({ contentSource: 'all' })}
            icon="🌐"
            label="Alle Plattformen"
            desc="Creator können Content von überall verwenden"
          />
          <SelectCard
            selected={data.contentSource === 'recent'}
            onClick={() => update({ contentSource: 'recent' })}
            icon="🕐"
            label="Letzte Videos"
            desc="Nur die neuesten Videos als Grundlage"
          />
          <SelectCard
            selected={data.contentSource === 'timeline'}
            onClick={() => update({ contentSource: 'timeline' })}
            icon="📅"
            label="Bestimmter Zeitraum"
            desc="Nur Videos aus einem bestimmten Zeitraum"
          />
          <SelectCard
            selected={data.contentSource === 'custom'}
            onClick={() => update({ contentSource: 'custom' })}
            icon="🎯"
            label="Bestimmtes Video"
            desc="Ein bestimmtes Video auswählen"
          />
          <SelectCard
            selected={data.contentSource === 'upload'}
            onClick={() => update({ contentSource: 'upload' })}
            icon="📤"
            label="Eigener Upload"
            desc="Datei hochladen (MP4) oder Link teilen"
          />
        </div>

        {/* Sub-options for timeline */}
        {data.contentSource === 'timeline' && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-gray-500 mb-1">Von</label>
                <input
                  type="date"
                  value={data.contentSourceData.from ?? ''}
                  onChange={(e) => update({ contentSourceData: { ...data.contentSourceData, from: e.target.value } })}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
                />
              </div>
              <div>
                <label className="block text-[12px] text-gray-500 mb-1">Bis</label>
                <input
                  type="date"
                  value={data.contentSourceData.to ?? ''}
                  onChange={(e) => update({ contentSourceData: { ...data.contentSourceData, to: e.target.value } })}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sub-options for upload */}
        {data.contentSource === 'upload' && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <input
              type="text"
              placeholder="Link zum Video, Drive, oder Dropbox..."
              value={data.contentSourceData.link ?? ''}
              onChange={(e) => update({ contentSourceData: { ...data.contentSourceData, link: e.target.value } })}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
            />
          </div>
        )}
      </RevealSection>

      {/* ── Section 3: Winner Method ── */}
      <RevealSection show={showWinnerMethod} id="winner-method">
        <SectionLabel>Wie wird der Gewinner ermittelt?</SectionLabel>
        <p className="text-[12px] text-gray-500 -mt-2 mb-3">Mehrere Methoden wählbar — Budget wird aufgeteilt.</p>
        <div className="space-y-2">
          <SelectCard
            selected={data.winnerMethods.includes('engagement')}
            onClick={() => toggleMethod('engagement')}
            icon="📊"
            label="Höchstes Engagement"
            desc="Zusammengesetzt aus Views, Kommentaren, Likes"
          />
          <SelectCard
            selected={data.winnerMethods.includes('total_views')}
            onClick={() => toggleMethod('total_views')}
            icon="👁"
            label="Höchste Gesamt-Views"
            desc="Ein Video-Submit pro Tag erlaubt"
          />
          <SelectCard
            selected={data.winnerMethods.includes('jury')}
            onClick={() => toggleMethod('jury')}
            icon="🏆"
            label="Bestes / Lustigstes Clip"
            desc="Jury entscheidet über den Gewinner"
          />
        </div>
      </RevealSection>

      {/* ── Section 4: Prize ── */}
      <RevealSection show={showPrize} id="prize">
        <SectionLabel>Was bekommt der Gewinner?</SectionLabel>
        <div className="space-y-3">
          {/* Prize type selection */}
          <div className="flex gap-2">
            {[
              { value: 'cash' as PrizeType, label: '💶 Geld' },
              { value: 'voucher' as PrizeType, label: '🎫 Gutschein' },
              { value: 'custom' as PrizeType, label: '🎁 Anderes' },
            ].map((opt) => (
              <QuickButton
                key={opt.value}
                selected={data.prizeType === opt.value}
                onClick={() => update({ prizeType: opt.value })}
              >
                {opt.label}
              </QuickButton>
            ))}
          </div>

          {/* Prize amount / description */}
          {data.prizeType === 'cash' ? (
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">Gesamtbudget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">€</span>
                <input
                  type="number"
                  value={data.prizeAmount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    update({ prizeAmount: val, prizeSplit: [val] })
                  }}
                  placeholder="z.B. 1000"
                  className="w-full pl-8 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[12px] text-gray-500 mb-1">
                {data.prizeType === 'voucher' ? 'Gutschein-Details (z.B. Amazon €50)' : 'Was gibt es zu gewinnen?'}
              </label>
              <input
                type="text"
                value={data.prizeDescription}
                onChange={(e) => update({ prizeDescription: e.target.value, prizeAmount: 1 })}
                placeholder={data.prizeType === 'voucher' ? 'Amazon Gutschein €50' : 'z.B. Gaming Setup, iPhone, etc.'}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          )}

          {/* Method budget split — if multiple methods selected */}
          {data.winnerMethods.length > 1 && data.prizeType === 'cash' && data.prizeAmount > 0 && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[12px] text-gray-400 mb-3">Budget pro Kategorie aufteilen:</p>
              <div className="space-y-2">
                {data.winnerMethods.map((m) => {
                  const label = m === 'engagement' ? 'Engagement' : m === 'total_views' ? 'Gesamt-Views' : 'Jury'
                  return (
                    <div key={m} className="flex items-center gap-3">
                      <span className="text-[13px] text-gray-300 w-28 flex-shrink-0">{label}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">€</span>
                        <input
                          type="number"
                          value={data.methodBudgetSplit[m] ?? ''}
                          onChange={(e) => {
                            const split = { ...data.methodBudgetSplit, [m]: parseInt(e.target.value) || 0 }
                            update({ methodBudgetSplit: split })
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between text-[12px] pt-1">
                  <span className="text-gray-500">Verteilt</span>
                  <span className={`font-medium ${
                    Object.values(data.methodBudgetSplit).reduce((a, b) => a + b, 0) === data.prizeAmount
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}>
                    €{Object.values(data.methodBudgetSplit).reduce((a, b) => a + b, 0)} / €{data.prizeAmount}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </RevealSection>

      {/* ── Section 5: Winner Count ── */}
      <RevealSection show={showWinnerCount} id="winner-count">
        <SectionLabel>Anzahl der Gewinner?</SectionLabel>
        <div className="flex gap-3">
          <QuickButton
            selected={data.winnerCount === 1}
            onClick={() => update({ winnerCount: 1, prizeSplit: [data.prizeAmount] })}
          >
            1 Gewinner
          </QuickButton>
          <QuickButton
            selected={data.winnerCount === 3}
            onClick={() => {
              const a = Math.round(data.prizeAmount * 0.5)
              const b = Math.round(data.prizeAmount * 0.3)
              const c = data.prizeAmount - a - b
              update({ winnerCount: 3, prizeSplit: [a, b, c] })
            }}
          >
            Top 3
          </QuickButton>
        </div>

        {/* Prize split for Top 3 */}
        {data.winnerCount === 3 && data.prizeType === 'cash' && (
          <div className="mt-4 space-y-2">
            {['🥇 1. Platz', '🥈 2. Platz', '🥉 3. Platz'].map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[13px] text-gray-400 w-20 flex-shrink-0">{label}</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">€</span>
                  <input
                    type="number"
                    value={data.prizeSplit[i] ?? 0}
                    onChange={(e) => {
                      const newSplit = [...data.prizeSplit]
                      newSplit[i] = parseInt(e.target.value) || 0
                      update({ prizeSplit: newSplit })
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </RevealSection>

      {/* ── Section 6: Timeframe ── */}
      <RevealSection show={showTimeframe} id="timeframe">
        <SectionLabel>Zeitraum</SectionLabel>
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-gray-500 mb-2">Start</label>
            <div className="flex gap-2 items-center">
              <QuickButton selected={data.startDate === new Date().toISOString().split('T')[0]} onClick={setToday}>
                Heute
              </QuickButton>
              <span className="text-gray-600 text-[12px]">oder</span>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-gray-500 mb-2">Ende</label>
            <div className="flex gap-2 flex-wrap mb-2">
              <QuickButton selected={false} onClick={() => setQuickEnd(14)}>2 Wochen</QuickButton>
              <QuickButton selected={false} onClick={() => setQuickEnd(30)}>30 Tage</QuickButton>
              <QuickButton selected={false} onClick={() => setQuickEnd(90)}>90 Tage</QuickButton>
            </div>
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[13px] focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>
      </RevealSection>

      {/* ── Section 7: Hashtag + Tag ── */}
      <RevealSection show={showHashtag} id="hashtag">
        <SectionLabel>Hashtag & Tag</SectionLabel>
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] text-gray-500 mb-1">Pflicht-Hashtag</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">#</span>
              <input
                value={data.hashtag.replace('#', '')}
                onChange={(e) => update({ hashtag: '#' + e.target.value.replace('#', '') })}
                placeholder="MeinContest2025"
                className="w-full pl-7 pr-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Teilnehmer müssen diesen Hashtag im Video verwenden.</p>
          </div>
          <div>
            <label className="block text-[12px] text-gray-500 mb-1">Tag (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                value={data.tag.replace('@', '')}
                onChange={(e) => update({ tag: e.target.value.replace('@', '') })}
                placeholder="deinAccount"
                className="w-full pl-7 pr-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Wenn angegeben, müssen Teilnehmer dich im Video taggen.</p>
          </div>
        </div>
      </RevealSection>

      {/* ── Section 8: Title + Confirm ── */}
      <RevealSection show={showTitle} id="title">
        <SectionLabel>Fast fertig — wie heißt dein Contest?</SectionLabel>
        <input
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="z.B. Best Clip Challenge 2025"
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[15px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50 mb-4"
        />

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !data.title.trim()}
          className="w-full py-3 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Wird erstellt...
            </>
          ) : (
            'Contest starten'
          )}
        </button>
      </RevealSection>

      {/* Bottom spacer for scroll */}
      <div className="h-40" />
    </div>
  )
}
