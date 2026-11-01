
'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import FloatingAssistant from './dashboard/FloatingAssistant'

export default function GlobalAssistant() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/assistant/session', {
        cache: 'no-store',
      })

      setAuthenticated(response.ok)
    } catch {
      setAuthenticated(false)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setAuthenticated(Boolean(session?.user))
        setChecking(false)
      }

      if (event === 'SIGNED_OUT') {
        setAuthenticated(false)
        setChecking(false)
      }
    })

    const handleFocus = () => {
      void checkSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkSession])

  useEffect(() => {
    void checkSession()
  }, [pathname, checkSession])

  if (checking || !authenticated) {
    return null
  }

  return <FloatingAssistant />
}
