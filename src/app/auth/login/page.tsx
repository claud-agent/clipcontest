'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tab = 'magic' | 'password'
type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('password')
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSent(true); setLoading(false) }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false) }
      else { setSent(true); setLoading(false) }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else { router.push('/dashboard'); router.refresh() }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">ClipContest</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check deine Mails!</h2>
              <p className="text-gray-400 text-sm mb-1">
                {tab === 'magic' ? 'Wir haben einen Magic Link an' : 'Bestätigungslink gesendet an'}
              </p>
              <p className="text-white font-medium mb-4">{email}</p>
              <button onClick={() => { setSent(false); setError('') }} className="text-brand-500 hover:underline text-sm">
                ← Zurück
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                <button
                  onClick={() => { setTab('password'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === 'password' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Email + Passwort
                </button>
                <button
                  onClick={() => { setTab('magic'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === 'magic' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {tab === 'password' ? (
                <>
                  <div className="flex gap-4 mb-5">
                    <button
                      onClick={() => { setMode('login'); setError('') }}
                      className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                        mode === 'login' ? 'text-white border-brand-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      Anmelden
                    </button>
                    <button
                      onClick={() => { setMode('signup'); setError('') }}
                      className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                        mode === 'signup' ? 'text-white border-brand-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      Registrieren
                    </button>
                  </div>

                  <form onSubmit={handlePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="du@beispiel.de" required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Passwort</label>
                      <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Mind. 6 Zeichen' : '••••••••'} required minLength={6}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}
                    <button type="submit" disabled={loading}
                      className="w-full py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                      {loading ? '...' : mode === 'login' ? 'Anmelden' : 'Account erstellen'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-5">Wir schicken dir einen Link per Email — kein Passwort nötig.</p>
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="du@beispiel.de" required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}
                    <button type="submit" disabled={loading}
                      className="w-full py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                      {loading ? 'Sende Link...' : 'Magic Link senden'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Zurück zur Startseite</Link>
        </p>
      </div>
    </div>
  )
}
