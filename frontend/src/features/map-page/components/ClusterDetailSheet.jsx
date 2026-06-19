import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import MetricCard from '@/shared/components/MetricCard'
import StatusBadge from '@/shared/components/StatusBadge'
import useMapPageStore from '../store/useMapPageStore'

export default function ClusterDetailSheet() {
  const selectedCluster = useMapPageStore((s) => s.selectedCluster)
  const clearSelectedCluster = useMapPageStore((s) => s.clearSelectedCluster)
  const isMobile = useIsMobile()
  const side = isMobile ? 'bottom' : 'right'
  const dragStartY = useRef(0)
  const scrollAreaRef = useRef(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (event) => {
    if (!isMobile) return

    const startedOnHandle = event.target.closest('[data-sheet-drag-handle]')
    if (!startedOnHandle && scrollAreaRef.current?.scrollTop > 0) return

    dragStartY.current = event.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (event) => {
    if (!isMobile || !isDragging) return

    const nextOffset = Math.max(0, event.touches[0].clientY - dragStartY.current)
    if (nextOffset > 6) event.preventDefault()
    setDragOffset(Math.min(nextOffset, 220))
  }

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return

    setIsDragging(false)
    if (dragOffset > 96) {
      clearSelectedCluster()
      setDragOffset(0)
      return
    }

    setDragOffset(0)
  }

  return (
    <Sheet
      open={Boolean(selectedCluster)}
      onOpenChange={(open) => {
        if (!open) clearSelectedCluster()
      }}
    >
      <SheetContent
        side={side}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={isMobile && (isDragging || dragOffset > 0) ? {
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : undefined,
        } : undefined}
        className={cn(
          'gap-0 overflow-hidden p-0',
          isMobile
            ? 'h-[72dvh] max-h-[74dvh] rounded-t-[28px] border-white/10 bg-slate-950 text-white shadow-2xl'
            : 'w-[min(calc(100vw-2rem),380px)] border-gray-200 bg-white/95 shadow-2xl backdrop-blur-md sm:max-w-[380px] md:!bottom-4 md:!right-4 md:!top-[calc(3rem+1rem)] md:!h-auto md:!w-[min(calc(100vw-2rem),380px)] md:!max-w-[380px] md:rounded-2xl md:border'
        )}
      >
        {isMobile ? <div data-sheet-drag-handle className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/25" /> : null}
        {selectedCluster ? <ClusterDetailContent selectedCluster={selectedCluster} scrollAreaRef={scrollAreaRef} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

function ClusterDetailContent({ selectedCluster, scrollAreaRef }) {
  const { indicators, movilidad } = selectedCluster

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white md:bg-white md:text-gray-900">
      <div className="shrink-0 border-b border-white/10 px-5 py-4 pr-14 md:border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
          Detalle de cluster
        </p>
        <SheetTitle className="mt-1 text-xl font-bold text-white md:text-gray-900">
          {selectedCluster.name}
        </SheetTitle>
        <SheetDescription className="mt-0.5 font-mono text-[10px] text-white/45 md:text-gray-400">
          {selectedCluster.code} · {selectedCluster.type} · {selectedCluster.subtype}
        </SheetDescription>
        <div className="mt-2">
          <StatusBadge label={selectedCluster.riskLabel} variant="red" dot={true} />
        </div>
      </div>

      <div ref={scrollAreaRef} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
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

        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Movilidad y red
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Flujo OD saliente</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white md:text-gray-900">{movilidad.flujoOD.value}</span>
                <span className="text-[10px] text-white/45 md:text-gray-400">{movilidad.flujoOD.unit}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/55 md:bg-gray-100 md:text-gray-500">
                  {movilidad.flujoOD.source}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Corredor asociado</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white md:text-gray-900">{movilidad.corredor.value}</span>
                <span className="rounded bg-orange-500/15 px-1.5 py-0.5 font-mono text-[9px] text-orange-300 md:bg-orange-100 md:text-orange-600">
                  {movilidad.corredor.tag}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Antenas / ERBs</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white md:text-gray-900">{movilidad.antenas.value}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/55 md:bg-gray-100 md:text-gray-500">
                  {movilidad.antenas.source}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Por qué importa
          </p>
          <p className="text-xs leading-relaxed text-white/65 md:text-gray-600">
            {selectedCluster.porQueImporta}
          </p>
        </div>

        <div className="px-5 py-4">
          <div
            className="rounded-xl border-2 border-purple-400/40 bg-purple-400/10 p-4 md:bg-[var(--bit-purple-muted)]"
            style={{ borderColor: 'var(--bit-purple-light)' }}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--bit-purple-light)' }} />
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--bit-purple-light)' }}
              >
                Recomendación · Generada por IA
              </p>
            </div>
            <p className="text-xs leading-relaxed text-white/70 md:text-gray-700">
              {selectedCluster.recomendacion}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/10 bg-slate-950/95 p-4 md:border-gray-100 md:bg-white">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg px-4 py-3 text-xs font-semibold text-white transition-colors hover:opacity-90 md:py-2.5"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            Preguntar sobre esta región
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-white/15 md:border-gray-200 md:bg-white md:py-2.5 md:text-gray-700 md:hover:bg-gray-50"
          >
            Comparar
          </button>
        </div>
      </div>
    </div>
  )
}
