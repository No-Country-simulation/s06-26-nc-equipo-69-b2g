import { cn } from '@/shared/lib/utils'

export default function MapLegend({ className }) {
  return (
    <div className={cn('pointer-events-auto absolute bottom-4 z-10 rounded-xl border border-gray-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm transition-[left] duration-200 md:bottom-6 md:px-5 md:py-4', className)}>
      <p className="mb-1.5 text-[11px] font-bold text-gray-800 md:mb-2 md:text-xs">Leyenda</p>
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
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span className="h-2 w-2 rounded-full bg-gray-800" />
          Antena / ERB
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span
            className="h-0.5 w-4 rounded bg-red-400"
            style={{ borderTop: '1px dashed #EF4444' }}
          />
          Corredor / gargalo
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-blue-500 text-[6px] text-blue-500">
            ○
          </span>
          Cluster señalado por la IA
        </div>
      </div>
    </div>
  )
}
