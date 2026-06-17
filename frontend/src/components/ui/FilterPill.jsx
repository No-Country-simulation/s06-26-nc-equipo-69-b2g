import useAppStore from '@/store/useAppStore'

const filterConfig = [
  { id: 'concentracion', label: 'Concentración', color: 'bg-green-500' },
  { id: 'antenas', label: 'Antenas / ERBs', color: 'bg-gray-800' },
  { id: 'clusters', label: 'Clusters', color: 'bg-blue-500' },
  { id: 'calidad', label: 'Calidad de red', color: 'bg-orange-500' },
  { id: 'flujos', label: 'Flujos OD', color: 'bg-gray-600' },
  { id: 'corredores', label: 'Corredores / gargalos', color: 'bg-red-500' },
  { id: 'riesgo', label: 'Riesgo calculado', color: 'bg-yellow-500' },
]

export { filterConfig }

export default function FilterPill({ id, label, color, isActive, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${isActive
          ? 'border-gray-300 bg-white text-gray-700 shadow-sm'
          : 'border-transparent bg-white/50 text-gray-400 hover:bg-white/80'
        }`}
    >
      <span className={`h-2 w-2 rounded-full ${color} ${!isActive ? 'opacity-40' : ''}`} />
      {label}
    </button>
  )
}
