import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/components/ui/sheet'
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
  const {
    name, code, municipio, riskLabel, riskVariant,
    score_riesgo, concentracion, vulnerabilidad, n_usuarios_total,
    pct_legacy_tech, pct_renda_baja, congestion_media, sin_cobertura, infra,
    n_assinantes, incomeBreakdown, ageBreakdown,
  } = selectedCluster

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white md:bg-white md:text-gray-900">
      <div className="shrink-0 border-b border-white/10 px-5 py-4 pr-14 md:border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
          Detalle de cluster
        </p>
        <SheetTitle className="mt-1 text-xl font-bold text-white md:text-gray-900">
          {name}
        </SheetTitle>
        <SheetDescription className="mt-0.5 font-mono text-[10px] text-white/45 md:text-gray-400">
          {code}{municipio ? ` · ${municipio}` : ''}
        </SheetDescription>
        <div className="mt-2">
          <StatusBadge label={riskLabel} variant={riskVariant ?? 'gray'} dot={true} />
        </div>
      </div>

      <div ref={scrollAreaRef} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Indicadores clave
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Score de riesgo"
              value={score_riesgo?.toFixed?.(2) ?? score_riesgo ?? '—'}
            />
            <MetricCard
              label="Concentración"
              value={concentracion ?? '—'}
            />
            <MetricCard
              label="Vulnerabilidad"
              value={vulnerabilidad?.toFixed?.(2) ?? vulnerabilidad ?? '—'}
            />
            <MetricCard
              label="Usuarios totales"
              value={n_usuarios_total?.toLocaleString?.('es') ?? n_usuarios_total ?? '—'}
            />
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Red y cobertura
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Congestión media</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{(congestion_media * 100)?.toFixed?.(1) ?? '—'}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">% Tecnología legacy</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{(pct_legacy_tech * 100)?.toFixed?.(1) ?? '—'}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">% Renda baja</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{(pct_renda_baja * 100)?.toFixed?.(1) ?? '—'}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Infraestructura</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{infra ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Sin cobertura</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{sin_cobertura ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>

        {n_assinantes > 0 && (
          <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
              Perfil demográfico
            </p>
            <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
              <span className="text-xs text-white/55 md:text-gray-500">Total assinantes</span>
              <span className="text-sm font-bold text-white md:text-gray-900">{n_assinantes?.toLocaleString?.('es') ?? '—'}</span>
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
              Distribución por ingreso
            </p>
            <div className="mb-3 space-y-1.5">
              {incomeBreakdown?.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-14 text-[11px] text-white/65 md:text-gray-500">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 md:bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] font-mono text-white/55 md:text-gray-400">{item.pct}%</span>
                </div>
              ))}
            </div>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
              Distribución por edad
            </p>
            <div className="space-y-1.5">
              {ageBreakdown?.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-1.5 md:border-gray-100 md:bg-white">
                  <span className="text-[11px] text-white/65 md:text-gray-500">{item.label}</span>
                  <span className="text-[11px] font-bold text-white md:text-gray-900">{item.value?.toLocaleString?.('es') ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
