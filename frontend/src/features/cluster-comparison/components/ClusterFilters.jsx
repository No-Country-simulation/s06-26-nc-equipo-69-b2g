import { Search, X } from 'lucide-react'

const filters = [
  { id: 'ALTO', label: 'Riesgo Alto', color: 'bg-red-500' },
  { id: 'MEDIO', label: 'Riesgo Medio', color: 'bg-yellow-500' },
]

export default function ClusterFilters({ activeFilters, onToggleFilter, search, onSearchChange }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Buscador */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cluster..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 shadow-sm transition-colors focus:border-[#564C8E] focus:outline-none focus:ring-1 focus:ring-[#564C8E]"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filtros de riesgo */}
      {filters.map((f) =>
        activeFilters.includes(f.id) ? (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: '#564C8E', borderColor: '#564C8E' }}
          >
            <span className={`h-2 w-2 rounded-full ${f.color}`} />
            {f.label}
            <button
              onClick={() => onToggleFilter(f.id)}
              className="-mr-0.5 ml-0.5 rounded-full p-0.5 text-white transition-opacity hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <button
            key={f.id}
            onClick={() => onToggleFilter(f.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-white/50 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-500"
          >
            <span className={`h-2 w-2 rounded-full ${f.color} opacity-40`} />
            {f.label}
          </button>
        )
      )}

      {/* Periodo (informativo) */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
        Periodo Jun2026 — 15 días
      </span>
    </div>
  )
}
