import { useState } from 'react'
import { Database, HelpCircle, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { filterConfig } from '../data/filterConfig'
import useMapPageStore from '../store/useMapPageStore'
import FilterPill from './FilterPill'
import PeriodSwitch from './PeriodoSwitch'

const normalize = (str) =>
  (str ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function ZoneSearch() {
  const [query, setQuery] = useState('')
  const clusterProperties = useMapPageStore((s) => s.clusterProperties)
  const selectZone = useMapPageStore((s) => s.selectZone)

  const matches = query.trim()
    ? Object.values(clusterProperties ?? {})
        .filter((p) => {
          const q = normalize(query)
          return normalize(p.cluster?.replace(/_/g, ' ')).includes(q) || normalize(p.municipio).includes(q)
        })
        .slice(0, 6)
    : []

  const handleSelect = (clusterName) => {
    selectZone(clusterName)
    setQuery('')
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches.length > 0) handleSelect(matches[0].cluster)
            if (e.key === 'Escape') setQuery('')
          }}
          placeholder="Buscar zona o municipio..."
          className="w-[min(14rem,calc(100vw-8rem))] bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none md:w-64"
        />
      </div>

      {matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          {matches.map((p) => (
            <li key={p.cluster}>
              <button
                type="button"
                onClick={() => handleSelect(p.cluster)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-purple-50/60"
              >
                <span>
                  <span className="block text-xs font-semibold text-gray-800">
                    {p.cluster?.replace(/_/g, ' ')}
                  </span>
                  <span className="block text-[10px] text-gray-400">{p.municipio}</span>
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    p.nivel_riesgo === 'ALTO' ? 'bg-red-500' : p.nivel_riesgo === 'MEDIO' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && matches.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-400 shadow-xl">
          Sin resultados para “{query}”
        </div>
      )}
    </div>
  )
}

export default function MapControlsGroup({ className, selectedPeriodo, onChangePeriodo }) {
  const [showFilters, setShowFilters] = useState(false)
  const activeFilters = useMapPageStore((s) => s.activeFilters)
  const toggleFilter = useMapPageStore((s) => s.toggleFilter)
  const openOnboarding = useMapPageStore((s) => s.openOnboarding)

  return (
    <div className={cn('pointer-events-none absolute top-3 z-10 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 transition-[left] duration-200 md:top-4 md:max-w-[calc(100vw-2rem)]', className)}>
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <ZoneSearch />

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

        <button
          type="button"
          onClick={openOnboarding}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-50"
          aria-label="Cómo usar el mapa"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Cómo usar el mapa</span>
        </button>
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
