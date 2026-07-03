import { useState } from 'react'
import { Database, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { filterConfig } from '../data/filterConfig'
import useMapPageStore from '../store/useMapPageStore'
import FilterPill from './FilterPill'
import PeriodSwitch from './PeriodoSwitch'

export default function MapControlsGroup({ className, selectedPeriodo, onChangePeriodo }) {
  const [showFilters, setShowFilters] = useState(false)
  const activeFilters = useMapPageStore((s) => s.activeFilters)
  const toggleFilter = useMapPageStore((s) => s.toggleFilter)

  return (
    <div className={cn('pointer-events-none absolute top-3 z-10 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 transition-[left] duration-200 md:top-4 md:max-w-[calc(100vw-2rem)]', className)}>
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cluster, zona o corredor..."
            className="w-[min(14rem,calc(100vw-8rem))] bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none md:w-64"
          />
        </div>

        <button
          type="button"
          aria-expanded={showFilters}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-50"
          onClick={() => setShowFilters((visible) => !visible)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </button>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
          <Database className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-700">Dataset CDRView · jun/2026</span>
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700">
            15 días
          </span>
        </div>
      </div>

      <div
        className={cn(
          'pointer-events-auto flex max-w-[min(760px,calc(100vw-2rem))] flex-wrap items-center justify-start gap-1.5 overflow-hidden transition-all duration-200 ease-out',
          showFilters ? 'max-h-32 translate-y-0 opacity-100' : 'max-h-0 -translate-y-1 opacity-0 pointer-events-none'
        )}
      >
        {filterConfig.map((filter) => (
          <FilterPill
            key={filter.id}
            {...filter}
            isActive={activeFilters.includes(filter.id)}
            onToggle={toggleFilter}
          />
        ))}
      </div>

      <div className="pointer-events-auto mt-1">
        <PeriodSwitch value={selectedPeriodo} onChange={onChangePeriodo} />
      </div>
    </div>
  )
}
