import useAuthStore from '../store/useAuthStore'
import LoginButton from './LoginButton'
import UserMenu from './UserMenu'

/**
 * Single entry point for the navbar auth slot: shows the user menu when
 * authenticated, the login button when not, and a placeholder while the
 * initial Supabase session check is still resolving.
 */
export default function AuthControl({ variant = 'dark' }) {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)

  if (user) return <UserMenu user={user} variant={variant} />
  if (status === 'loading') {
    const placeholder = variant === 'light' ? 'bg-gray-200' : 'bg-white/20'
    return <div className={`h-7 w-7 animate-pulse rounded-full ${placeholder}`} aria-hidden="true" />
  }
  return <LoginButton variant={variant} />
}
