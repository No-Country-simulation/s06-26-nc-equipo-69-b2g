import { LogIn } from 'lucide-react'
import AuthPopover from './AuthPopover'
import GoogleIcon from './GoogleIcon'
import { signInWithGoogle } from '../lib/googleAuth'

const TRIGGER_VARIANTS = {
  dark: 'border-white/20 bg-white/10 text-white hover:bg-white/20',
  light: 'border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50',
}

export default function LoginButton({ variant = 'dark' }) {
  return (
    <AuthPopover
      align={variant === 'light' ? 'left' : 'right'}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${TRIGGER_VARIANTS[variant]}`}
        >
          <LogIn className="h-3.5 w-3.5" />
          Login
        </button>
      )}
    >
      {({ close }) => (
        <div className="w-60 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl">
          <p className="mb-2 px-1 text-xs font-medium text-gray-500">
            Ingresá para guardar tu sesión
          </p>
          <button
            type="button"
            onClick={() => {
              close()
              signInWithGoogle()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <GoogleIcon className="h-4 w-4" />
            Continuar con Google
          </button>
        </div>
      )}
    </AuthPopover>
  )
}
