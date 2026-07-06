import { LogOut } from 'lucide-react'
import AuthPopover from './AuthPopover'
import { signOut } from '../lib/googleAuth'

function getInitials(user) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  const source = name || user.email || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return letters.toUpperCase()
}

function Avatar({ user, className, textClassName }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
      />
    )
  }
  return <span className={textClassName}>{getInitials(user)}</span>
}

const TRIGGER_VARIANTS = {
  dark: { ring: 'ring-white/30 hover:ring-white/60', bg: 'rgba(255,255,255,0.25)', text: 'text-white' },
  light: { ring: 'ring-purple-200 hover:ring-purple-300', bg: 'rgba(86,76,142,0.15)', text: 'text-purple-700' },
}

export default function UserMenu({ user, variant = 'dark' }) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const trigger = TRIGGER_VARIANTS[variant]

  return (
    <AuthPopover
      align={variant === 'light' ? 'left' : 'right'}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menú de usuario"
          className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full ring-2 transition ${trigger.ring}`}
          style={{ backgroundColor: trigger.bg }}
        >
          <Avatar user={user} className="h-full w-full" textClassName={`text-xs font-bold ${trigger.text}`} />
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-100">
              <Avatar user={user} className="h-full w-full" textClassName="text-xs font-bold text-purple-700" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              {user.email ? <p className="truncate text-xs text-gray-500">{user.email}</p> : null}
            </div>
          </div>
          <div className="my-1 h-px bg-gray-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close()
              signOut()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            Cerrar sesión
          </button>
        </div>
      )}
    </AuthPopover>
  )
}
