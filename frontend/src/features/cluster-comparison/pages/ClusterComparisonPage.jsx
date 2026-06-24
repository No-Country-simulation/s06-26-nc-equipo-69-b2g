import { FileDown, Bot } from 'lucide-react'
import ClusterFilters from '../components/ClusterFilters'
import ClusterTable from '../components/ClusterTable'

export default function ClusterComparisonPage() {
  return (
    <main className="flex-1 overflow-hidden px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comparar clusters priorizados</h1>
        <p className="mt-1 text-sm text-gray-500">
          Clusters ordenados por riesgo territorial calculado · Dataset CDRView · jun/2026 · ventana de 15 días
        </p>
      </div>
      <ClusterFilters />
      <ClusterTable />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">2 clusters seleccionados</span>
          <span className="text-sm text-gray-400">·</span>
          <span className="text-sm text-gray-400">São José · Kobrasol · Palhoça Centro</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#6B21A8]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#6B21A8] transition-colors hover:bg-[#6B21A8]/5">
            <FileDown className="h-3.5 w-3.5" />
            Exportar PDF
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#6B21A8' }}>
            <Bot className="h-3.5 w-3.5" />
            Preguntar a la IA sobre estos clusters
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Calidad de red y congestión son estimaciones derivadas de la actividad de antenas (CDRView), no mediciones oficiales de campo.
      </p>
    </main>
  )
}
