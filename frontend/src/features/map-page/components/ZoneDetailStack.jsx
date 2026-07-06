import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import StatusBadge from '@/shared/components/StatusBadge'
import useMapPageStore from '../store/useMapPageStore'
import ClusterDetailContent from './ClusterDetailContent'

const COLLAPSE_THRESHOLD_PX = 90
const CARD_OVERLAP_PX = 176 // how much each stacked card hides the previous one
const TAB_OVERLAP_PX = 14 // Excel-like tab overlap

const riskDotColor = {
  ALTO: 'bg-red-500',
  MEDIO: 'bg-yellow-500',
  BAJO: 'bg-green-500',
}

/**
 * Pointer-based downward drag used to swipe an expanded card back into its tab.
 * `onCommit` gets the raw delta on release so the caller checks the threshold.
 */
function useDragToCollapse(onCommit) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)

  const handlers = {
    onPointerDown: (event) => {
      startY.current = event.clientY
      setDragging(true)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove: (event) => {
      if (!dragging) return
      setOffset(Math.max(0, Math.min(event.clientY - startY.current, 320)))
    },
    onPointerUp: (event) => {
      if (!dragging) return
      setDragging(false)
      setOffset(0)
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      onCommit(event.clientY - startY.current)
    },
    onPointerCancel: () => {
      setDragging(false)
      setOffset(0)
    },
  }

  return { offset, dragging, handlers }
}

export default function ZoneDetailStack() {
  const openZones = useMapPageStore((s) => s.openZones)
  const expandedZoneIds = useMapPageStore((s) => s.expandedZoneIds)
  const toggleZoneExpanded = useMapPageStore((s) => s.toggleZoneExpanded)
  const collapseZone = useMapPageStore((s) => s.collapseZone)
  const closeZone = useMapPageStore((s) => s.closeZone)

  if (openZones.length === 0) return null

  const expandedZones = openZones.filter((zone) => expandedZoneIds.includes(zone.code))

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-end gap-2 px-3 pt-3 md:px-4 md:pt-4">
      {expandedZones.length > 0 ? (
        // Overlapping deck of cards; hovering/focusing one brings it to front.
        <div className="pointer-events-auto flex max-w-full items-end">
          {expandedZones.map((zone, index) => (
            <ZoneCard
              key={zone.code}
              zone={zone}
              index={index}
              onCollapse={() => collapseZone(zone.code)}
              onClose={() => closeZone(zone.code)}
            />
          ))}
        </div>
      ) : null}

      {/* Excel-like overlapping tab strip. The wrapper is pointer-events-auto so
          this whole area is not click-through to the map. */}
      <div className="pointer-events-auto flex max-w-full items-center">
        {openZones.map((zone, index) => (
          <ZoneTab
            key={zone.code}
            zone={zone}
            index={index}
            expanded={expandedZoneIds.includes(zone.code)}
            onToggle={() => toggleZoneExpanded(zone.code)}
            onClose={() => closeZone(zone.code)}
          />
        ))}
      </div>
    </div>
  )
}

function ZoneCard({ zone, index, onCollapse, onClose }) {
  const [entered, setEntered] = useState(false)
  const [raised, setRaised] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const { offset, dragging, handlers } = useDragToCollapse((delta) => {
    if (delta > COLLAPSE_THRESHOLD_PX) onCollapse()
  })

  const translateY = entered ? `${offset}px` : '110%'

  return (
    <div
      onMouseEnter={() => setRaised(true)}
      onMouseLeave={() => setRaised(false)}
      onFocusCapture={() => setRaised(true)}
      onBlurCapture={() => setRaised(false)}
      className={cn(
        'pointer-events-auto relative flex h-[min(56dvh,500px)] w-[min(86vw,320px)] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-2xl transition-shadow',
        'border-white/10 bg-slate-950 text-white md:border-gray-200 md:bg-white md:text-gray-900',
        raised && 'shadow-[0_24px_60px_rgba(0,0,0,0.35)]'
      )}
      style={{
        marginLeft: index === 0 ? 0 : -CARD_OVERLAP_PX,
        zIndex: raised ? 100 : index + 1,
        transform: `translateY(${translateY})`,
        transition: dragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="shrink-0 cursor-grab touch-none border-b border-white/10 px-4 pb-2.5 pt-2 active:cursor-grabbing md:border-gray-100"
        {...handlers}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/25 md:bg-gray-300" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
              Detalle de zona
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold text-white md:text-gray-900">{zone.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onCollapse}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white md:text-gray-400 md:hover:bg-gray-100 md:hover:text-gray-700"
              aria-label={`Minimizar ${zone.name}`}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white md:text-gray-400 md:hover:bg-gray-100 md:hover:text-gray-700"
              aria-label={`Cerrar ${zone.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-2">
          <StatusBadge label={zone.riskLabel} variant={zone.riskVariant ?? 'gray'} dot={true} />
        </div>
      </div>

      <ClusterDetailContent selectedCluster={zone} />
    </div>
  )
}

function ZoneTab({ zone, index, expanded, onToggle, onClose }) {
  const [raised, setRaised] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle()
        }
      }}
      onMouseEnter={() => setRaised(true)}
      onMouseLeave={() => setRaised(false)}
      onFocus={() => setRaised(true)}
      onBlur={() => setRaised(false)}
      title={expanded ? `Minimizar ${zone.name}` : `Ver ${zone.name}`}
      style={{
        marginLeft: index === 0 ? 0 : -TAB_OVERLAP_PX,
        zIndex: raised || expanded ? 100 : index + 1,
      }}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t-xl border py-1.5 pl-3 pr-1.5 text-xs font-medium shadow-md backdrop-blur-sm transition-[transform,background-color]',
        raised && '-translate-y-0.5',
        expanded
          ? 'border-purple-300 bg-purple-50 text-purple-900'
          : 'border-gray-200 bg-white/95 text-gray-700 hover:bg-white'
      )}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', riskDotColor[zone.riskLevel] ?? 'bg-gray-400')} />
      <span className="max-w-[8.5rem] truncate">{zone.name}</span>
      {expanded ? (
        <ChevronDown className="h-3 w-3 shrink-0 text-purple-400" aria-hidden="true" />
      ) : (
        <ChevronUp className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-current opacity-50 transition-opacity hover:bg-black/5 hover:opacity-100"
        aria-label={`Cerrar ${zone.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
