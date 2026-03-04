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

  const inputClass = "w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-[14px] placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all duration-200"

  return (
    <div className="min-h-screen bg-[#0c0d0f] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-white">ClipContest</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-1.5">Check deine Mails</h2>
              <p className="text-gray-400 text-[13px] mb-1">
                {tab === 'magic' ? 'Magic Link gesendet an' : 'Bestätigungslink gesendet an'}
              </p>
              <p className="text-white font-medium text-[14px] mb-4">{email}</p>
              <button onClick={() => { setSent(false); setError('') }} className="text-brand-400 hover:text-brand-300 text-[13px] transition-colors duration-200">
                &larr; Zurück
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 mb-6">
                <button
                  onClick={() => { setTab('password'); setError('') }}
                  className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
                    tab === 'password' ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Email + Passwort
                </button>
                <button
                  onClick={() => { setTab('magic'); setError('') }}
                  className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
                    tab === 'magic' ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {tab === 'password' ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-4">
                    <button
                      onClick={() => { setMode('login'); setError('') }}
                      className={`text-[13px] font-semibold pb-1 border-b-2 transition-all duration-200 ${
                        mode === 'login' ? 'text-white border-brand-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      Anmelden
                    </button>
                    <button
                      onClick={() => { setMode('signup'); setError('') }}
                      className={`text-[13px] font-semibold pb-1 border-b-2 transition-all duration-200 ${
                        mode === 'signup' ? 'text-white border-brand-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      Registrieren
                    </button>
                    </div>
                    {mode === 'login' && (
                      <Link href="/auth/forgot-password" className="text-[13px] text-brand-400 hover:text-brand-300 transition-colors duration-200">
                        Vergessen?
                      </Link>
                    )}
                  </div>

                  <form onSubmit={handlePassword} className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="du@beispiel.de" required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Passwort</label>
                      <input
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Mind. 6 Zeichen' : '••••••••'} required minLength={6}
                        className={inputClass}
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">{error}</div>
                    )}
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg transition-all duration-200"
                    >
                      {loading ? '...' : mode === 'login' ? 'Anmelden' : 'Account erstellen'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-[13px] mb-5">Wir schicken dir einen Link per Email — kein Passwort nötig.</p>
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="du@beispiel.de" required
                        className={inputClass}
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">{error}</div>
                    )}
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg transition-all duration-200"
                    >
                      {loading ? 'Sende...' : 'Magic Link senden'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-[13px] mt-6">
          <Link href="/" className="hover:text-gray-400 transition-colors duration-200">&larr; Zurück zur Startseite</Link>
        </p>
      </div>
    </div>
  )
}
