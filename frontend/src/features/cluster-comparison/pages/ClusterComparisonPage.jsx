import { useState } from 'react'
import { FileDown, Bot } from 'lucide-react'
import ClusterFilters from '../components/ClusterFilters'
import ClusterTable from '../components/ClusterTable'

function formatClusterName(name) {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' · ')
}

export default function ClusterComparisonPage() {
  const [selected, setSelected] = useState([])
  const [activeFilters, setActiveFilters] = useState(['ALTO', 'MEDIO'])
  const [search, setSearch] = useState('')

  const handleToggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleToggleFilter = (id) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const selectedNames = selected
    .map((n) => formatClusterName(n))
    .slice(0, 3)
    .join(' · ')

  const remaining = selected.length > 3 ? ` · +${selected.length - 3} más` : ''

  return (
    <main className="min-h-full bg-[#F2F3F1] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-xl font-bold text-[#21262B]">Comparar regiones priorizadas</h1>
          <p className="text-sm text-[#5B6269]">
            Regiones ordenadas por riesgo territorial calculado · Dataset CDRView · jun/2026 · ventana de 15 días
          </p>
        </div>
        <section className="rounded-2xl border border-[#E2E4DF] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,35,0.07)] sm:p-5">
          <ClusterFilters
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            search={search}
            onSearchChange={setSearch}
          />
          <ClusterTable
            selected={selected}
            onToggle={handleToggle}
            activeFilters={activeFilters}
            search={search}
          />
        </section>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E2E4DF] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {selected.length > 0
                ? `${selected.length} ${selected.length === 1 ? 'región seleccionada' : 'regiones seleccionadas'}`
                : 'Ninguna región seleccionada'}
            </span>
            {selected.length > 0 && (
              <>
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm text-gray-400">{selectedNames}{remaining}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#564C8E]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#564C8E] transition-colors hover:bg-[#564C8E]/5">
              <FileDown className="h-3.5 w-3.5" />
              Exportar PDF
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#564C8E' }}>
              <Bot className="h-3.5 w-3.5" />
              Preguntar a la IA
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-[#8A9197]">
          Calidad de red y congestión son estimaciones derivadas de la actividad de antenas (CDRView), no mediciones oficiales de campo.
        </p>
      </div>
    </main>
  )
}
