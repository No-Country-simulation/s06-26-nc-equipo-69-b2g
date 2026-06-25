import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const filters = [
  { id: 'alto', label: 'Riesgo Alto', color: 'bg-red-500' },
  { id: 'medio', label: 'Riesgo Medio', color: 'bg-yellow-500' },
]

export default function ClusterFilters() {
  const [active, setActive] = useState(['alto', 'medio'])

  const remove = (id) => {
    setActive((prev) => prev.filter((f) => f !== id))
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.map((f) =>
        active.includes(f.id) ? (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: '#564C8E', borderColor: '#564C8E' }}
          >
            <span className={`h-2 w-2 rounded-full ${f.color}`} />
            {f.label}
            <button
              onClick={() => remove(f.id)}
              className="-mr-0.5 ml-0.5 rounded-full p-0.5 text-white transition-opacity hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <button
            key={f.id}
            onClick={() => setActive((prev) => [...prev, f.id])}
            className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-white/50 px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-500"
          >
            <span className={`h-2 w-2 rounded-full ${f.color} opacity-40`} />
            {f.label}
          </button>
        )
      )}

      {active.length > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
          Periodo Jun2026 — 15 días
          <button className="-mr-0.5 ml-0.5 rounded-full p-0.5 transition-colors hover:bg-gray-100">
            <X className="h-3 w-3 text-gray-400" />
          </button>
        </span>
      )}

      <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700">
        <Plus className="h-3 w-3" />
        Agregar cluster
      </button>
    </div>
  )
}
