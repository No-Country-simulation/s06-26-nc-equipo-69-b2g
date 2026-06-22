import { PanelLeftClose, PanelLeftOpen, Send, Sparkles } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import StatusBadge from '@/shared/components/StatusBadge'
import { mockSidebarClusters } from '../data/mockSidebarClusters'
import useMapPageStore from '../store/useMapPageStore'

const quickActions = [
  '¿Qué región debería priorizarse?',
  'Riesgo de exclusión digital',
]

export default function AiChatPanel() {
  const isLeftSidebarOpen = useMapPageStore((s) => s.isLeftSidebarOpen)
  const toggleLeftSidebar = useMapPageStore((s) => s.toggleLeftSidebar)

  if (!isLeftSidebarOpen) {
    return (
      <button
        type="button"
        onClick={toggleLeftSidebar}
        className="absolute left-4 top-4 z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-lg transition-colors hover:bg-gray-50 md:flex"
        aria-label="Abrir asistente BiT"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>
    )
  }

  return (
    <aside className="absolute bottom-4 left-4 top-4 z-20 hidden w-[min(calc(100vw-2rem),380px)] flex-col rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md md:flex">
      <AiChatContent onClose={toggleLeftSidebar} />
    </aside>
  )
}

export function MobileAiChatSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(92vw,380px)] gap-0 overflow-hidden rounded-r-2xl border-r border-gray-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-[380px]"
      >
        <SheetTitle className="sr-only">Asistente BiT</SheetTitle>
        <AiChatContent onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

function AiChatContent({ onClose }) {
  const openMockClusterDetail = useMapPageStore((s) => s.openMockClusterDetail)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
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
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Cerrar asistente BiT"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="sidebar-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
        <div
          className="rounded-xl rounded-tl-sm px-3 py-2 text-xs text-white"
          style={{ backgroundColor: 'var(--bit-purple-deep)' }}
        >
          ¿Dónde hay alta concentración de personas y baja calidad de red?
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            IA
          </div>
          <span className="text-[10px] font-medium text-gray-700">Asistente BiT</span>
          <span className="text-[10px] text-gray-400">1,9 s · trazable</span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-xs leading-relaxed text-gray-600">
          <p>
            Hay <strong className="text-gray-800">3 clusters críticos</strong> con alta concentración
            y conectividad estimada baja. <strong className="text-gray-800">São José ·
            Kobrasol</strong> debería priorizarse: 47.800 personas en pico diurno, calidad de red media-baja
            y congestión alta.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {mockSidebarClusters.map((cluster) => (
            <button
              key={cluster.name}
              type="button"
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

        <div
          className="rounded-lg border-l-[3px] bg-green-50/50 p-3"
          style={{ borderLeftColor: 'var(--bit-success-green)' }}
        >
          <p
            className="mb-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--bit-success-green)' }}
          >
            Recomendación
          </p>
          <p className="text-xs leading-relaxed text-gray-600">
            Mejorar la conectividad en São José · Kobrasol antes de expandir programas digitales
            remotos en la región.
          </p>
        </div>

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

        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
          <input
            type="text"
            placeholder="Preguntale al territorio..."
            className="min-w-0 flex-1 bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={openMockClusterDetail}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-purple-700 transition-colors hover:bg-purple-100"
            aria-label="Abrir detalle del cluster recomendado"
          >
            <Sparkles className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
            aria-label="Enviar pregunta"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
