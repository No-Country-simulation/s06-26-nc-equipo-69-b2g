import { create } from 'zustand'
import { setAuthToken } from '@/shared/api/authToken'

const STORAGE_KEY = 'bit.auth'

// Optimistic hydration: read the last session from localStorage so the UI shows
// the logged-in state instantly on reload. The auth listener then re-validates
// against Supabase and refreshes (or clears) it.
function loadPersisted() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const persisted = loadPersisted()
if (persisted?.token) setAuthToken(persisted.token)

const useAuthStore = create((set) => ({
  user: persisted?.user ?? null,
  token: persisted?.token ?? null,
  // 'loading' until the first Supabase session check resolves.
  status: 'loading',

  setSession: ({ user, token }) => {
    setAuthToken(token)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    } catch {
      // Storage unavailable (private mode): session stays in memory only.
    }
    set({ user, token, status: 'authenticated' })
  },

  clear: () => {
    setAuthToken(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    set({ user: null, token: null, status: 'unauthenticated' })
  },

  setStatus: (status) => set({ status }),
}))

export default useAuthStore
