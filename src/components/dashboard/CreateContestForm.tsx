'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateContestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    platform: 'tiktok',
    hashtag: '',
    prize: '',
    rules: '',
    start_date: '',
    end_date: '',
    max_entries: '100',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('contests')
      .insert({
        creator_id: user.id,
        title: form.title,
        description: form.description || null,
        platform: form.platform,
        hashtag: form.hashtag || null,
        prize: form.prize ? parseFloat(form.prize) : 0,
        rules: form.rules || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        max_entries: parseInt(form.max_entries) || 100,
        status,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/contests/${data.id}`)
    router.refresh()
  }

  return (
    <form className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Contest-Name <span className="text-brand-500">*</span>
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="z.B. Sommer Dance Challenge 2025"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Beschreibung
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Worum geht es bei deinem Contest?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
        />
      </div>

      {/* Platform + Hashtag */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Plattform
          </label>
          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="tiktok">🎵 TikTok</option>
            <option value="instagram">📸 Instagram</option>
            <option value="youtube">▶️ YouTube</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Hashtag
          </label>
          <input
            name="hashtag"
            value={form.hashtag}
            onChange={handleChange}
            placeholder="#MeinContest"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Startdatum
          </label>
          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Enddatum
          </label>
          <input
            type="datetime-local"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Prize + Max entries */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Preisgeld (€)
          </label>
          <input
            type="number"
            name="prize"
            value={form.prize}
            onChange={handleChange}
            placeholder="500"
            min="0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Max. Einreichungen
          </label>
          <input
            type="number"
            name="max_entries"
            value={form.max_entries}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Regeln & Teilnahmebedingungen
        </label>
        <textarea
          name="rules"
          value={form.rules}
          onChange={handleChange}
          rows={4}
          placeholder="1. Das Video muss original sein.&#10;2. Hashtag muss verwendet werden.&#10;3. ..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={loading || !form.title}
          onClick={(e) => handleSubmit(e as any, 'draft')}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white font-semibold rounded-xl transition-colors"
        >
          Als Entwurf speichern
        </button>
        <button
          type="button"
          disabled={loading || !form.title}
          onClick={(e) => handleSubmit(e as any, 'active')}
          className="flex-1 py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Wird erstellt...' : 'Contest starten 🚀'}
        </button>
      </div>
    </form>
  )
}
