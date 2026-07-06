import { useState } from 'react'
import { ChevronDown, List } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export default function MapLegend({ className }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'pointer-events-auto absolute bottom-4 z-10 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-50 md:bottom-6',
          className
        )}
        aria-expanded={false}
        aria-label="Abrir leyenda"
      >
        <List className="h-3.5 w-3.5" />
        Leyenda
      </button>
    )
  }

  return (
    <div className={cn('pointer-events-auto absolute bottom-4 z-10 rounded-xl border border-gray-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm transition-[left] duration-200 md:bottom-6 md:px-5 md:py-4', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="mb-1.5 flex w-full items-center justify-between gap-4 text-[11px] font-bold text-gray-800 md:mb-2 md:text-xs"
        aria-expanded={true}
        aria-label="Cerrar leyenda"
      >
        Leyenda
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      <p className="mb-2 text-[9px] text-gray-500 md:text-[10px]">Concentración de personas</p>

      <div
        className="mb-1 h-2 w-32 rounded-full md:h-2.5 md:w-48"
        style={{ background: 'linear-gradient(to right, #FDE68A, #F59E0B, #EA580C, #DC2626, #991B1B)' }}
      />
      <div className="flex justify-between text-[9px] text-gray-400 md:mb-3">
        <span>Baja</span>
        <span>Alta</span>
      </div>

      <div className="hidden flex-col gap-1.5 md:flex">
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">Zonas (riesgo de exclusión)</p>
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-red-800/60 bg-red-600/50" /> Alto
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-yellow-700/60 bg-yellow-500/50" /> Medio
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-green-800/60 bg-green-500/50" /> Bajo
          </span>
        </div>
        <p className="text-[9px] text-gray-400">Tamaño de burbuja = score de riesgo</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span className="h-2 w-2 rounded-full border border-white bg-slate-800 shadow" />
          Zona sin cobertura de red
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <svg width="13" height="13" viewBox="0 0 56 56" aria-hidden="true">
            <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round" fill="none">
              <path d="M28 50 V27" />
              <path d="M18 21 a14 14 0 0 1 20 0" />
              <path d="M11 14 a24 24 0 0 1 34 0" />
            </g>
            <circle cx="28" cy="27" r="5.5" fill="#0f172a" />
          </svg>
          Antena / ERB
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span
            className="w-4"
            style={{ borderTop: '2px dashed #00bcd4' }}
          />
          Corredor / gargalo
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-blue-500 text-[6px] text-blue-500">
            ○
          </span>
          Zona señalada por la IA
        </div>
      </div>
    </div>
  )
}
