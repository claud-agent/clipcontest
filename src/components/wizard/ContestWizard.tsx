'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardData = {
  // Step 1
  platform: 'tiktok'
  title: string
  // Step 2
  start_date: string
  end_date: string
  update_frequency: 'hourly' | 'every6hours' | 'daily'
  // Step 3
  participation_hashtag: string
  participation_tag: string
  max_entries_per_person: 1
  // Step 4
  winner_logic: 'jury' | 'views' | 'hybrid'
  // Step 5
  winner_count: 1 | 2 | 3
  prize_split: number[]
  terms: string
}

// ─── Terms Generator ─────────────────────────────────────────────────────────

function generateTerms(data: WizardData): string {
  const logicText =
    data.winner_logic === 'views'
      ? `Die Gewinner werden anhand der View-Anzahl ermittelt. Um Manipulation zu verhindern, behält sich der Veranstalter das Recht vor, Einreichungen mit unnatürlichem Wachstum oder gekauften Views zu disqualifizieren.`
      : data.winner_logic === 'jury'
      ? `Die Gewinner werden durch eine unabhängige Jury ausgewählt. Die Entscheidung der Jury ist endgültig und nicht anfechtbar.`
      : `Die Gewinner werden durch eine Kombination aus View-Zahlen und einer Jury-Entscheidung ermittelt (Hybrid-Modell). Die Jury behält sich vor, Einreichungen mit verdächtigem Wachstum zu disqualifizieren.`

  const prizesText = data.prize_split
    .slice(0, data.winner_count)
    .map((amount, i) => `   ${i + 1}. Platz: €${amount}`)
    .join('\n')

  const startDate = data.start_date
    ? new Date(data.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '[Startdatum]'
  const endDate = data.end_date
    ? new Date(data.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '[Enddatum]'

  return `TEILNAHMEBEDINGUNGEN – ${data.title || '[Contest Name]'}

Veranstalter: [Dein Name / Unternehmen]
Plattform: TikTok
Zeitraum: ${startDate} bis ${endDate}

TEILNAHME
• Erstelle ein TikTok-Video und nutze den Hashtag ${data.participation_hashtag || '#[Hashtag]'}${data.participation_tag ? ` und tagge @${data.participation_tag}` : ''}.
• Pro Person ist maximal 1 Einreichung erlaubt.
• Teilnahme ab 18 Jahren. Minderjährige benötigen die Zustimmung eines Erziehungsberechtigten.
• Das eingereichte Video muss original und selbst erstellt sein.
• Einreichungen mit beleidigenden, diskriminierenden oder rechtswidrigen Inhalten werden disqualifiziert.

GEWINNERAUSWAHL
${logicText}

PREISE
${prizesText}
• Die Auszahlung erfolgt innerhalb von 14 Tagen nach Bekanntgabe der Gewinner.
• Steuern und Abgaben trägt der Gewinner selbst.

SONSTIGES
• Dieser Contest steht in keiner Verbindung zu TikTok Inc. oder dessen Muttergesellschaft.
• Der Veranstalter behält sich vor, den Contest bei technischen Problemen oder Regelverstößen jederzeit zu beenden oder zu ändern.
• Die Teilnahme am Contest gilt als Zustimmung zu diesen Bedingungen.
• Diese Regeln sind öffentlich einsehbar.`
}

// ─── Step Components ─────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                i + 1 < step
                  ? 'bg-brand-500 text-white'
                  : i + 1 === step
                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                  : 'bg-white/10 text-gray-500'
              }`}
            >
              {i + 1 < step ? '✓' : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-brand-500' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Plattform</span>
        <span>Zeitraum</span>
        <span>Teilnahme</span>
        <span>Gewinner</span>
        <span>Preis</span>
      </div>
    </div>
  )
}

// Step 1: Platform
function Step1({ data, update }: { data: WizardData; update: (d: Partial<WizardData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Plattform wählen</h2>
      <p className="text-gray-400 text-sm mb-6">Auf welcher Plattform soll der Contest stattfinden?</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* TikTok - Active */}
        <button
          onClick={() => update({ platform: 'tiktok' })}
          className="p-4 rounded-xl border-2 border-brand-500 bg-brand-500/10 text-center transition-all"
        >
          <div className="text-3xl mb-2">🎵</div>
          <div className="text-white font-semibold text-sm">TikTok</div>
          <div className="text-brand-500 text-xs mt-1">Verfügbar</div>
        </button>

        {/* Instagram - Disabled */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center opacity-40 cursor-not-allowed">
          <div className="text-3xl mb-2">📸</div>
          <div className="text-gray-400 font-semibold text-sm">Instagram</div>
          <div className="text-gray-600 text-xs mt-1">Bald</div>
        </div>

        {/* YouTube - Disabled */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center opacity-40 cursor-not-allowed">
          <div className="text-3xl mb-2">▶️</div>
          <div className="text-gray-400 font-semibold text-sm">YouTube</div>
          <div className="text-gray-600 text-xs mt-1">Bald</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Contest-Name <span className="text-brand-500">*</span>
        </label>
        <input
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="z.B. Sommer Dance Challenge 2025"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
      </div>
    </div>
  )
}

// Step 2: Timing
function Step2({ data, update }: { data: WizardData; update: (d: Partial<WizardData>) => void }) {
  const freqOptions = [
    { value: 'hourly', label: 'Stündlich', desc: 'View-Daten werden jede Stunde aktualisiert' },
    { value: 'every6hours', label: 'Alle 6 Stunden', desc: 'Empfohlen für die meisten Contests' },
    { value: 'daily', label: 'Täglich', desc: 'Günstigste Option, einmal pro Tag' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Zeitraum festlegen</h2>
      <p className="text-gray-400 text-sm mb-6">Alle Zeiten gelten in der Zeitzone Europe/Berlin.</p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Startdatum & -zeit</label>
          <input
            type="datetime-local"
            value={data.start_date}
            onChange={(e) => update({ start_date: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Enddatum & Stichtag</label>
          <input
            type="datetime-local"
            value={data.end_date}
            onChange={(e) => update({ end_date: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Update-Frequenz der View-Daten
        </label>
        <div className="space-y-2">
          {freqOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ update_frequency: opt.value as WizardData['update_frequency'] })}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                data.update_frequency === opt.value
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                data.update_frequency === opt.value ? 'border-brand-500 bg-brand-500' : 'border-gray-600'
              }`} />
              <div>
                <div className="text-white text-sm font-medium">{opt.label}</div>
                <div className="text-gray-400 text-xs">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-2">
          ℹ️ Häufigere Updates verbrauchen mehr API-Anfragen. Phase 3 zeigt Daten sobald Tracking eingerichtet ist.
        </p>
      </div>
    </div>
  )
}

// Step 3: Participation
function Step3({ data, update }: { data: WizardData; update: (d: Partial<WizardData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Teilnahmebedingungen</h2>
      <p className="text-gray-400 text-sm mb-6">Wie nehmen Creators teil?</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Pflicht-Hashtag <span className="text-brand-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">#</span>
            <input
              value={data.participation_hashtag.replace('#', '')}
              onChange={(e) => update({ participation_hashtag: '#' + e.target.value.replace('#', '') })}
              placeholder="MeinContest2025"
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">Teilnehmer müssen diesen Hashtag im Video verwenden.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Pflicht-Tag (optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input
              value={data.participation_tag.replace('@', '')}
              onChange={(e) => update({ participation_tag: e.target.value.replace('@', '') })}
              placeholder="deinTikTokAccount"
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">Wenn angegeben, müssen Teilnehmer dich im Video taggen.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Max. 1 Entry pro Person</p>
              <p className="text-gray-400 text-xs mt-0.5">Schützt gegen Spam und ist fairer für alle.</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-brand-500 flex items-center justify-end px-1 flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-xs font-medium mb-1">📋 So funktioniert die Teilnahme:</p>
          <p className="text-gray-400 text-xs">
            Teilnehmer laden ihr Video auf TikTok hoch, nutzen {data.participation_hashtag || '#[Hashtag]'}{data.participation_tag ? ` und taggen @${data.participation_tag}` : ''}, und reichen dann den TikTok-Link über deine Contest-Seite ein.
          </p>
        </div>
      </div>
    </div>
  )
}

// Step 4: Winner Logic
function Step4({ data, update }: { data: WizardData; update: (d: Partial<WizardData>) => void }) {
  const options = [
    {
      value: 'views',
      icon: '📊',
      label: 'Views',
      desc: 'Der Clip mit den meisten Views gewinnt.',
      pros: 'Objektiv & transparent',
      cons: 'Anfällig für gekaufte Views',
      anti: true,
    },
    {
      value: 'jury',
      icon: '👥',
      label: 'Jury',
      desc: 'Du oder eine Jury entscheidet manuell.',
      pros: 'Qualität zählt, nicht Reichweite',
      cons: 'Weniger transparent',
      anti: false,
    },
    {
      value: 'hybrid',
      icon: '⚡',
      label: 'Hybrid',
      desc: 'Views + Jury-Bestätigung.',
      pros: 'Fairster Ansatz',
      cons: 'Mehr Aufwand',
      anti: true,
      recommended: true,
    },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Gewinnerauswahl</h2>
      <p className="text-gray-400 text-sm mb-6">Wie wird der Gewinner ermittelt?</p>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ winner_logic: opt.value as WizardData['winner_logic'] })}
            className={`w-full p-4 rounded-xl border text-left transition-all relative ${
              data.winner_logic === opt.value
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {opt.recommended && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                Empfohlen
              </span>
            )}
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                data.winner_logic === opt.value ? 'border-brand-500 bg-brand-500' : 'border-gray-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-white font-semibold">{opt.label}</span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{opt.desc}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-400">✓ {opt.pros}</span>
                  <span className="text-red-400/70">✗ {opt.cons}</span>
                </div>
                {opt.anti && (
                  <p className="text-yellow-400/70 text-xs mt-1.5">
                    🛡️ Anti-Manipulations-Klausel wird automatisch in die Bedingungen aufgenommen.
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 5: Prize + Terms
function Step5({ data, update }: { data: WizardData; update: (d: Partial<WizardData>) => void }) {
  const updatePrizeSplit = (index: number, value: string) => {
    const newSplit = [...data.prize_split]
    newSplit[index] = parseFloat(value) || 0
    update({ prize_split: newSplit })
  }

  const total = data.prize_split.slice(0, data.winner_count).reduce((a, b) => a + b, 0)

  const regenerateTerms = () => {
    update({ terms: generateTerms(data) })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Preise & Bedingungen</h2>
      <p className="text-gray-400 text-sm mb-6">Lege die Preise fest und prüfe die Teilnahmebedingungen.</p>

      {/* Winner count */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Anzahl Gewinner</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => {
                const newSplit = [500, 300, 200].slice(0, n)
                update({ winner_count: n as 1 | 2 | 3, prize_split: newSplit })
              }}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
                data.winner_count === n
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              {n} {n === 1 ? 'Gewinner' : 'Gewinner'}
            </button>
          ))}
        </div>
      </div>

      {/* Prize split */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Preisgeld-Aufteilung (€)</label>
        <div className="space-y-2">
          {Array.from({ length: data.winner_count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-16 flex-shrink-0">
                {['🥇 1.', '🥈 2.', '🥉 3.'][i]} Platz
              </span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input
                  type="number"
                  value={data.prize_split[i] ?? 0}
                  onChange={(e) => updatePrizeSplit(i, e.target.value)}
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-gray-500 text-xs">Gesamtpreisgeld</span>
          <span className="text-white font-bold">€{total}</span>
        </div>
      </div>

      {/* Terms */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Teilnahmebedingungen</label>
          <button
            onClick={regenerateTerms}
            className="text-xs text-brand-500 hover:text-brand-500/80 transition-colors"
          >
            ↺ Neu generieren
          </button>
        </div>
        <textarea
          value={data.terms}
          onChange={(e) => update({ terms: e.target.value })}
          rows={10}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors resize-none"
        />
        <p className="text-gray-600 text-xs mt-1">Du kannst die Bedingungen frei bearbeiten. Sie werden auf der Contest-Seite öffentlich angezeigt.</p>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

const defaultData: WizardData = {
  platform: 'tiktok',
  title: '',
  start_date: '',
  end_date: '',
  update_frequency: 'every6hours',
  participation_hashtag: '',
  participation_tag: '',
  max_entries_per_person: 1,
  winner_logic: 'hybrid',
  winner_count: 1,
  prize_split: [500],
  terms: '',
}

export default function ContestWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (partial: Partial<WizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial }
      // Auto-regenerate terms if on step 5
      if (step === 5) {
        return { ...next, terms: generateTerms(next) }
      }
      return next
    })
  }

  const canProceed = () => {
    if (step === 1) return data.title.trim().length > 0
    if (step === 2) return data.start_date && data.end_date
    if (step === 3) return data.participation_hashtag.length > 1
    return true
  }

  const handleNext = () => {
    if (step === 4) {
      // Generate terms before showing step 5
      setData((prev) => ({ ...prev, terms: generateTerms(prev) }))
    }
    setStep((s) => s + 1)
  }

  const handleSubmit = async (status: 'draft' | 'active') => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: contest, error: err } = await supabase
      .from('contests')
      .insert({
        creator_id: user.id,
        title: data.title,
        platform: data.platform,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        update_frequency: data.update_frequency,
        participation_hashtag: data.participation_hashtag,
        participation_tag: data.participation_tag || null,
        max_entries_per_person: 1,
        winner_logic: data.winner_logic,
        winner_count: data.winner_count,
        prize_split: data.prize_split,
        prize: data.prize_split.reduce((a, b) => a + b, 0),
        terms: data.terms,
        anti_manipulation: data.winner_logic !== 'jury',
        status,
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/contests/${contest.id}`)
    router.refresh()
  }

  return (
    <div>
      <ProgressBar step={step} total={5} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="px-5 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl transition-colors hover:bg-white/10"
          >
            ← Zurück
          </button>
        )}

        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            Weiter →
          </button>
        ) : (
          <div className="flex gap-3 flex-1">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Als Entwurf speichern
            </button>
            <button
              onClick={() => handleSubmit('active')}
              disabled={loading}
              className="flex-1 py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Wird erstellt...' : '🚀 Contest starten'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
