'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function DashboardNav({ user }: { user: User }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="p-4 border-t border-white/5">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-500 text-xs font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{user.email}</p>
          <p className="text-gray-500 text-xs">Creator</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-xs"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Abmelden
      </button>
    </div>
  )
}
