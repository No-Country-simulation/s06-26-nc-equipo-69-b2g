import { Send, Sparkles, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'

const clusters = [
  { name: 'São José · Kobrasol', value: '47.800', level: 'Media-baja', risk: 'Alto', variant: 'green' },
  { name: 'Palhoça Centro', value: '33.100', level: 'Baja', risk: 'Alto', variant: 'green' },
]

const quickActions = [
  '¿Qué región debería priorizarse?',
  'Riesgo de exclusión digital',
]

export default function LeftSidebar() {
  return (
    <aside className="sidebar-scroll flex w-[320px] shrink-0 flex-col border-r border-gray-200 bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
               style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
            IA
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">Asistente BiT</p>
            <p className="text-[10px] text-gray-400">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              conectado a Visent CDRView
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-gray-500">Florianópolis</p>
          <p className="text-[10px] text-gray-400">jun/2026</p>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* User message bubble */}
        <div className="rounded-xl rounded-tl-sm px-3 py-2 text-xs text-white"
             style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
          ¿Dónde hay alta concentración de personas y baja calidad de red?
        </div>

        {/* Assistant response header */}
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
               style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
            IA
          </div>
          <span className="text-[10px] font-medium text-gray-700">Asistente BiT</span>
          <span className="text-[10px] text-gray-400">1,9 s · trazable</span>
        </div>

        {/* Assistant response body */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs leading-relaxed text-gray-600">
          <p>
            Hay <strong className="text-gray-800">3 clusters críticos</strong> con alta concentración
            y conectividad estimada baja. <strong className="text-gray-800">São José ·
            Kobrasol</strong> debería priorizarse: 47.800 personas en pico diurno, calidad de red media-baja
            y congestión alta.
          </p>
        </div>

        {/* Cluster list */}
        <div className="flex flex-col gap-2">
          {clusters.map((cluster) => (
            <button
              key={cluster.name}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-purple-200 hover:bg-purple-50/30"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{cluster.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {cluster.value} · {cluster.level}
                  </p>
                </div>
              </div>
              <StatusBadge label={cluster.risk} variant="green" />
            </button>
          ))}
        </div>

        {/* Recommendation */}
        <div className="rounded-lg border-l-[3px] bg-green-50/50 p-3"
             style={{ borderLeftColor: 'var(--bit-success-green)' }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider"
             style={{ color: 'var(--bit-success-green)' }}>
            Recomendación
          </p>
          <p className="text-xs leading-relaxed text-gray-600">
            Mejorar la conectividad en São José · Kobrasol antes de expandir programas digitales
            remotos en la región.
          </p>
        </div>

        {/* Traceability */}
        <div className="rounded-lg border border-gray-100 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Trazabilidad</p>
          <div className="space-y-1.5">
            {[
              { label: 'Datos usados', value: 'Concentración, calidad de red, congestión, flujos OD' },
              { label: 'Fuente', value: 'Visent CDRView (sintético, agregado)' },
              { label: 'Período', value: 'Dataset CDRView · jun/2026' },
            ].map((item) => (
              <div key={item.label} className="flex gap-2 text-[10px]">
                <span className="w-16 shrink-0 font-medium text-gray-500">{item.label}</span>
                <span className="text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
          <input
            type="text"
            placeholder="Preguntale al territorio..."
            className="flex-1 bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none"
          />
          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  )
}
