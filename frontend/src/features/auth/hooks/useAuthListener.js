import { useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { exchangeSession } from '../api/authService'
import useAuthStore from '../store/useAuthStore'

/**
 * Wires Supabase auth to our backend session. `onAuthStateChange` fires with
 * INITIAL_SESSION on mount (and after the OAuth redirect / token refresh):
 * when there is a Supabase session we exchange its access token for our JWT,
 * otherwise we clear the local session.
 */
export function useAuthListener() {
  useEffect(() => {
    let active = true
    const { setSession, clear } = useAuthStore.getState()

    const sync = async (session) => {
      const accessToken = session?.access_token
      if (!accessToken) {
        if (active) clear()
        return
      }
      try {
        const { token, user } = await exchangeSession(accessToken)
        if (active) setSession({ user, token })
      } catch (err) {
        console.warn('Auth session exchange failed:', err)
        if (active) clear()
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])
}
