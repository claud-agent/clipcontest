'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function ContestActions({
  contestId,
  currentStatus,
}: {
  contestId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (status: string) => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('contests').update({ status }).eq('id', contestId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      {currentStatus === 'draft' && (
        <button
          onClick={() => updateStatus('active')}
          disabled={loading}
          className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          Aktivieren
        </button>
      )}
      {currentStatus === 'active' && (
        <button
          onClick={() => updateStatus('ended')}
          disabled={loading}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          Beenden
        </button>
      )}
    </div>
  )
}
