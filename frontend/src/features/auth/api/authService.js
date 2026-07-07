import { apiPost } from '@/shared/api/client'

/**
 * Exchanges a Supabase access token for our own backend session.
 * The backend validates the token against Supabase and returns
 * `{ ok, token, user }` — `token` is our controlled JWT.
 */
export function exchangeSession(accessToken) {
  return apiPost('/api/v1/auth/session', { accessToken })
}
