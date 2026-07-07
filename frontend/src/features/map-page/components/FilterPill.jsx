import { EyeOff } from 'lucide-react'

export default function FilterPill({ id, label, color, isActive, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      aria-pressed={isActive}
      title={isActive ? `Ocultar capa: ${label}` : `Mostrar capa: ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${isActive
          ? 'border-gray-300 bg-white text-gray-700 shadow-sm'
          : 'border-dashed border-gray-300 bg-white/70 text-gray-500 hover:border-gray-400 hover:bg-white hover:text-gray-700'
        }`}
    >
      <span className={`h-2 w-2 rounded-full ${color} ${!isActive ? 'opacity-40' : ''}`} />
      {label}
      {!isActive ? <EyeOff className="h-3 w-3 text-gray-400" aria-hidden="true" /> : null}
    </button>
  )
}
