import { supabase } from '@/shared/lib/supabase'

/**
 * Starts the Google OAuth flow. Supabase redirects to Google and back to
 * `redirectTo`; on return, supabase-js detects the session in the URL and the
 * auth listener exchanges it for our backend session.
 */
export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}
