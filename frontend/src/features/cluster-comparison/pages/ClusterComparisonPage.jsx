import ClusterFilters from '../components/ClusterFilters'
import ClusterTable from '../components/ClusterTable'

export default function ClusterComparisonPage() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comparar clusters priorizados</h1>
        <p className="mt-1 text-sm text-gray-500">
          Clusters ordenados por riesgo territorial calculado · Dataset CDRView · jun/2026 · ventana de 15 días
        </p>
      </div>
      <ClusterFilters />
      <ClusterTable />
    </div>
  )
}
