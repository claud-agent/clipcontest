'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
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
              <p className="text-gray-400 text-[13px] mb-1">Reset-Link gesendet an</p>
              <p className="text-white font-medium text-[14px] mb-4">{email}</p>
              <button
                onClick={() => { setSent(false); setError('') }}
                className="text-brand-400 hover:text-brand-300 text-[13px] transition-colors duration-200"
              >
                &larr; Zurück
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-[18px] font-bold text-white mb-1.5">Passwort vergessen?</h1>
                <p className="text-gray-500 text-[13px]">
                  Gib deine Email ein — wir schicken dir einen Link zum Zurücksetzen.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="du@beispiel.de"
                    required
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg transition-all duration-200"
                >
                  {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-[13px] mt-6">
          <Link href="/auth/login" className="hover:text-gray-400 transition-colors duration-200">
            &larr; Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  )
}
