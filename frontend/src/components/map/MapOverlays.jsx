import { Search, SlidersHorizontal, Database } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import FilterPill, { filterConfig } from '@/components/ui/FilterPill'

export default function MapOverlays() {
  const activeFilters = useAppStore((s) => s.activeFilters)
  const toggleFilter = useAppStore((s) => s.toggleFilter)

  return (
    <>
      {/* Top bar: Search + Filters + Dataset */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex flex-col items-center gap-2 px-4 pt-4">
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cluster, zona o corredor..."
              className="w-64 bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none"
            />
          </div>

          {/* Filters button */}
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-50">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>

          {/* Dataset selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
            <Database className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-700">Dataset CDRView · jun/2026</span>
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700">
              15 días
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5">
          {filterConfig.map((filter) => (
            <FilterPill
              key={filter.id}
              {...filter}
              isActive={activeFilters.includes(filter.id)}
              onToggle={toggleFilter}
            />
          ))}
        </div>
      </div>

      {/* Legend - bottom center */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur-sm">
        <p className="mb-2 text-xs font-bold text-gray-800">Leyenda</p>
        <p className="mb-2 text-[10px] text-gray-500">Concentración de personas (pico diurno)</p>

        {/* Gradient bar */}
        <div className="mb-1 h-2.5 w-48 rounded-full"
             style={{ background: 'linear-gradient(to right, #FDE68A, #F59E0B, #EA580C, #DC2626, #991B1B)' }} />
        <div className="mb-3 flex justify-between text-[9px] text-gray-400">
          <span>Baja</span>
          <span>Alta</span>
        </div>

        {/* Legend items */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span className="h-2 w-2 rounded-full bg-gray-800" />
            Antena / ERB
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span className="h-0.5 w-4 rounded bg-red-400"
                  style={{ borderTop: '1px dashed #EF4444' }} />
            Corredor / gargalo
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-blue-500 text-[6px] text-blue-500">
              ○
            </span>
            Cluster señalado por la IA
          </div>
        </div>
      </div>
    </>
  )
}
