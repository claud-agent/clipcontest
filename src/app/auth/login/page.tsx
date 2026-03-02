'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
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
          <p className="text-gray-400 mt-2 text-sm">Creator-Plattform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Anmelden</h1>
              <p className="text-gray-400 text-sm mb-6">
                Wir schicken dir einen Magic Link per Email — kein Passwort nötig.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email-Adresse
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="du@beispiel.de"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-500/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {loading ? 'Sende Link...' : 'Magic Link senden'}
                </button>
              </form>

              <p className="text-center text-gray-500 text-xs mt-6">
                Mit dem Anmelden stimmst du unseren{' '}
                <a href="#" className="text-gray-400 hover:text-white">AGB</a>{' '}
                und der{' '}
                <a href="#" className="text-gray-400 hover:text-white">Datenschutzerklärung</a>{' '}
                zu.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check deine Mails!</h2>
              <p className="text-gray-400 text-sm mb-1">
                Wir haben einen Magic Link an
              </p>
              <p className="text-white font-medium mb-4">{email}</p>
              <p className="text-gray-500 text-xs">
                Kein Email? Checke deinen Spam-Ordner oder{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-brand-500 hover:underline"
                >
                  versuche es nochmal
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          <Link href="/" className="hover:text-gray-400 transition-colors">
            ← Zurück zur Startseite
          </Link>
        </p>
      </div>
    </div>
  )
}
