import { X, Sparkles } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'

export default function RightSidebar() {
  const selectedCluster = useAppStore((s) => s.selectedCluster)
  const clearSelectedCluster = useAppStore((s) => s.clearSelectedCluster)

  if (!selectedCluster) return null

  const { indicators, movilidad } = selectedCluster

  return (
    <aside className="sidebar-scroll flex w-[360px] shrink-0 flex-col border-l border-gray-200 bg-white overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Detalle de cluster
          </p>
          <button
            onClick={clearSelectedCluster}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mt-1 text-xl font-bold text-gray-900">{selectedCluster.name}</h2>
        <p className="mt-0.5 text-[10px] font-mono text-gray-400">
          {selectedCluster.code} · {selectedCluster.type} · {selectedCluster.subtype}
        </p>
        <div className="mt-2">
          <StatusBadge label={selectedCluster.riskLabel} variant="red" dot={true} />
        </div>
      </div>

      {/* Key indicators */}
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Indicadores clave
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label={indicators.concentracion.label}
            value={indicators.concentracion.value}
            trend={indicators.concentracion.trend}
          />
          <MetricCard
            label={indicators.conectividad.label}
            value={indicators.conectividad.value}
            sublabel={indicators.conectividad.sublabel}
          />
          <MetricCard
            label={indicators.congestion.label}
            value={indicators.congestion.value}
            sublabel={indicators.congestion.sublabel}
          />
          <MetricCard
            label={indicators.tecnologia.label}
            value={indicators.tecnologia.value}
            sublabel={indicators.tecnologia.sublabel}
          />
        </div>
      </div>

      {/* Mobility and Network */}
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Movilidad y red
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
            <span className="text-xs text-gray-500">Flujo OD saliente</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{movilidad.flujoOD.value}</span>
              <span className="text-[10px] text-gray-400">{movilidad.flujoOD.unit}</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-mono text-gray-500">
                {movilidad.flujoOD.source}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
            <span className="text-xs text-gray-500">Corredor asociado</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{movilidad.corredor.value}</span>
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-mono text-orange-600">
                {movilidad.corredor.tag}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
            <span className="text-xs text-gray-500">Antenas / ERBs</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{movilidad.antenas.value}</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-mono text-gray-500">
                {movilidad.antenas.source}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Why it matters */}
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Por qué importa
        </p>
        <p className="text-xs leading-relaxed text-gray-600">
          {selectedCluster.porQueImporta}
        </p>
      </div>

      {/* AI Recommendation */}
      <div className="px-5 py-4">
        <div className="rounded-xl border-2 p-4"
             style={{ borderColor: 'var(--bit-purple-light)', backgroundColor: 'var(--bit-purple-muted)' }}>
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--bit-purple-light)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest"
               style={{ color: 'var(--bit-purple-light)' }}>
              Recomendación · Generada por IA
            </p>
          </div>
          <p className="text-xs leading-relaxed text-gray-700">
            {selectedCluster.recomendacion}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            Preguntar sobre esta región
          </button>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            Comparar
          </button>
        </div>
      </div>
    </aside>
  )
}
