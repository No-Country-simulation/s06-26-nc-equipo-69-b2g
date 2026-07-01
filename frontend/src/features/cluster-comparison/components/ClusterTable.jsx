import { useState, useEffect, useMemo, Fragment } from 'react'
import { Info, WifiOff, SearchX, ChevronDown, ChevronUp, ChevronsUpDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { supabase } from '@/shared/lib/supabase'
import { Spinner } from '@/shared/components/ui/spinner'

function formatClusterName(name) {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' · ')
}

function formatNumber(n) {
  if (n === 0 || n === null || n === undefined) return '0'
  return n.toLocaleString('pt-BR')
}

function formatPct(n) {
  if (n === null || n === undefined) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function congestionLabel(val) {
  if (val === 0 || val === null) return '—'
  if (val < 0.2) return 'Baja'
  if (val < 0.35) return 'Media'
  return 'Alta'
}

function congestionColor(val) {
  if (val === 0 || val === null) return 'bg-gray-200'
  if (val < 0.2) return 'bg-green-500'
  if (val < 0.35) return 'bg-yellow-500'
  return 'bg-red-500'
}

function calidadLabel(pctLegacy) {
  if (pctLegacy === 0 || pctLegacy === null) return '—'
  if (pctLegacy > 0.8) return 'Baja'
  if (pctLegacy > 0.75) return 'Media-baja'
  return 'Media'
}

function calidadColor(pctLegacy) {
  if (pctLegacy === 0 || pctLegacy === null) return 'bg-gray-200'
  if (pctLegacy > 0.8) return 'bg-red-500'
  if (pctLegacy > 0.75) return 'bg-yellow-500'
  return 'bg-green-500'
}

function generarAccion(cluster) {
  if (cluster.sin_cobertura) return 'Sin cobertura · evaluar expansión'
  if (cluster.score_riesgo > 0.6) return 'Reforzar red · infraestructura primero'
  if (cluster.congestion_media > 0.35) return 'Descongestionar en hora pico'
  if (cluster.pct_legacy_tech > 0.78) return 'Modernizar tecnología legado'
  return 'Monitorear estacionalidad'
}

const riskInfo = 'Score calculado a partir de concentración, congestión, movilidad y conectividad.'

// Columnas que se pueden ordenar
const SORTABLE_COLUMNS = {
  cluster: { label: 'Cluster', field: 'cluster', type: 'string' },
  usuarios: { label: 'Usuarios', field: 'n_usuarios_total', type: 'number' },
  score: { label: 'Score', field: 'score_riesgo', type: 'number' },
  red: { label: 'Red', field: 'pct_legacy_tech', type: 'number' },
  congestion: { label: 'Congestión', field: 'congestion_media', type: 'number' },
  riesgo: { label: 'Riesgo', field: 'nivel_riesgo', type: 'string' },
}

function SortIcon({ column, current }) {
  if (current?.column !== column) return <ChevronsUpDown className="ml-1 h-3 w-3 text-gray-300" />
  return current.direction === 'asc'
    ? <ChevronUp className="ml-1 h-3 w-3 text-[#564C8E]" />
    : <ChevronDown className="ml-1 h-3 w-3 text-[#564C8E]" />
}

function RowDetail({ cluster }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Score breakdown */}
      <div className="rounded-xl border border-[#E2E4DF] bg-[#F9FAF8] p-3">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Score</h4>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-gray-600">General</span>
          <span className="font-semibold" style={{ color: cluster.score_riesgo > 0.6 ? '#EF4444' : cluster.score_riesgo > 0.45 ? '#EAB308' : '#22C55E' }}>
            {cluster.score_riesgo.toFixed(3)}
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.round(cluster.score_riesgo * 100)}%`,
              backgroundColor: cluster.score_riesgo > 0.6 ? '#EF4444' : cluster.score_riesgo > 0.45 ? '#EAB308' : '#22C55E',
            }}
          />
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Infraestructura</span>
              <span className="font-medium">{cluster.infra.toFixed(3)}</span>
            </div>
            <div className="mt-0.5 h-1 w-full rounded-full bg-gray-200">
              <div className="h-1 rounded-full bg-blue-500" style={{ width: `${Math.round(cluster.infra * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Concentración</span>
              <span className="font-medium">{cluster.concentracion.toFixed(3)}</span>
            </div>
            <div className="mt-0.5 h-1 w-full rounded-full bg-gray-200">
              <div className="h-1 rounded-full bg-purple-500" style={{ width: `${Math.round(cluster.concentracion * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">Vulnerabilidad</span>
              <span className="font-medium">{cluster.vulnerabilidad.toFixed(3)}</span>
            </div>
            <div className="mt-0.5 h-1 w-full rounded-full bg-gray-200">
              <div className="h-1 rounded-full bg-amber-500" style={{ width: `${Math.round(cluster.vulnerabilidad * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Users + Renta */}
      <div className="rounded-xl border border-[#E2E4DF] bg-[#F9FAF8] p-3">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Demografía</h4>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-gray-600">Usuarios totales</span>
          <span className="text-lg font-bold text-gray-900">{formatNumber(cluster.n_usuarios_total)}</span>
        </div>
        {cluster.n_usuarios_total > 0 && (
          <div className="mb-3 h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min((cluster.n_usuarios_total / 1500000) * 100, 100)}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span>Renta baja</span>
          <span className="font-medium">{formatPct(cluster.pct_renta_baja)}</span>
        </div>
        <div className="mt-0.5 h-1 w-full rounded-full bg-gray-200">
          <div className="h-1 rounded-full bg-amber-500" style={{ width: `${Math.round(cluster.pct_renta_baja * 100)}%` }} />
        </div>
      </div>

      {/* Congestión + Calidad */}
      <div className="rounded-xl border border-[#E2E4DF] bg-[#F9FAF8] p-3">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Red</h4>
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Congestión</span>
            <span className="font-semibold">{congestionLabel(cluster.congestion_media)}</span>
          </div>
          {cluster.congestion_media > 0 && (
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div className={`h-1.5 rounded-full ${congestionColor(cluster.congestion_media)}`}
                style={{ width: `${Math.round(cluster.congestion_media * 100)}%` }} />
            </div>
          )}
          <p className="mt-0.5 text-[10px] text-gray-400">{formatPct(cluster.congestion_media)} en hora pico</p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Calidad de red</span>
            <span className="font-semibold">{calidadLabel(cluster.pct_legacy_tech)}</span>
          </div>
          {cluster.pct_legacy_tech > 0 && (
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div className={`h-1.5 rounded-full ${calidadColor(cluster.pct_legacy_tech)}`}
                style={{ width: `${Math.round(cluster.pct_legacy_tech * 100)}%` }} />
            </div>
          )}
          <p className="mt-0.5 text-[10px] text-gray-400">{formatPct(cluster.pct_legacy_tech)} tecnología legado</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
          {cluster.lat && cluster.lon && (
            <span>📍 {cluster.lat.toFixed(3)}, {cluster.lon.toFixed(3)}</span>
          )}
          <span>🔄 {new Date(cluster.updated_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Acción recomendada (full width) */}
      <div className="col-span-full rounded-xl border border-[#E2E4DF] bg-[#F9FAF8] p-3">
        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Acción recomendada</h4>
        <p className="text-sm font-medium text-gray-800">
          {cluster.sin_cobertura ? (
            <span className="text-red-600">Priorizar expansión de cobertura — zona sin servicio</span>
          ) : cluster.score_riesgo > 0.6 ? (
            <span>Reforzar infraestructura de red — score de riesgo alto ({(cluster.score_riesgo * 100).toFixed(0)}%)</span>
          ) : cluster.congestion_media > 0.35 ? (
            <span>Descongestionar en hora pico — congestión del {(cluster.congestion_media * 100).toFixed(0)}%</span>
          ) : cluster.pct_legacy_tech > 0.78 ? (
            <span>Modernizar tecnología legado — {(cluster.pct_legacy_tech * 100).toFixed(0)}% en tecnología antigua</span>
          ) : (
            <span>Monitorear estacionalidad — sin acciones urgentes detectadas</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default function ClusterTable({ selected = [], onToggle, activeFilters = ['ALTO', 'MEDIO'], search = '' }) {
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState(null) // { column: string, direction: 'asc' | 'desc' }
  const [expanded, setExpanded] = useState(null) // cluster name

  useEffect(() => {
    async function fetchClusters() {
      try {
        const { data, error } = await supabase
          .from('riesgo_regiao')
          .select('*')
          .order('score_riesgo', { ascending: false })

        if (error) throw error
        setClusters(data || [])
      } catch (err) {
        console.error('Error fetching clusters:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchClusters()
  }, [])

  const sorted = useMemo(() => {
    let result = clusters

    // Filtrar por nivel de riesgo
    result = result.filter((c) => activeFilters.includes(c.nivel_riesgo))

    // Filtrar por búsqueda
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.cluster.toLowerCase().includes(term) ||
          c.municipio.toLowerCase().includes(term)
      )
    }

    // Ordenar
    if (sort) {
      const col = SORTABLE_COLUMNS[sort.column]
      if (col) {
        result = [...result].sort((a, b) => {
          let valA = a[col.field]
          let valB = b[col.field]

          if (col.type === 'string') {
            valA = (valA || '').toString().toLowerCase()
            valB = (valB || '').toString().toLowerCase()
            return sort.direction === 'asc'
              ? valA.localeCompare(valB)
              : valB.localeCompare(valA)
          }

          // number
          valA = valA ?? 0
          valB = valB ?? 0
          return sort.direction === 'asc' ? valA - valB : valB - valA
        })
      }
    }

    return result
  }, [clusters, activeFilters, search, sort])

  const handleSort = (column) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return null // tercer click: sin orden
    })
  }

  const handleRowClick = (clusterName) => {
    setExpanded((prev) => (prev === clusterName ? null : clusterName))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6 text-[#564C8E]" />
        <span className="ml-2 text-sm text-gray-500">Cargando clusters...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">Error al cargar datos: {error}</p>
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <SearchX className="mb-2 h-8 w-8" />
        <p className="text-sm">No se encontraron clusters con los filtros actuales</p>
        <p className="mt-1 text-xs text-gray-300">Probá cambiar los filtros o el término de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E4DF] bg-white shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F5F6F4]">
            <TableHead className="w-10 px-3 py-2.5"></TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('cluster')}
            >
              <span className="inline-flex items-center">
                Cluster
                <SortIcon column="cluster" current={sort} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('usuarios')}
            >
              <span className="inline-flex items-center justify-end">
                Usuarios
                <SortIcon column="usuarios" current={sort} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('score')}
            >
              <span className="inline-flex items-center">
                Score
                <SortIcon column="score" current={sort} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('red')}
            >
              <span className="inline-flex items-center">
                Red
                <SortIcon column="red" current={sort} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('congestion')}
            >
              <span className="inline-flex items-center">
                Congestión
                <SortIcon column="congestion" current={sort} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700"
              onClick={() => handleSort('riesgo')}
            >
              <span className="inline-flex items-center">
                Riesgo
                <SortIcon column="riesgo" current={sort} />
              </span>
            </TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Acción</TableHead>
          </TableRow>

          {/* Indicador de orden activo */}
          {sort && (
            <TableRow className="bg-[#FAFBF9]">
              <TableCell colSpan={8} className="px-3 py-1 text-[10px] text-gray-400">
                Ordenado por <span className="font-medium text-gray-600">{SORTABLE_COLUMNS[sort.column]?.label}</span>{' '}
                ({sort.direction === 'asc' ? 'ascendente' : 'descendente'})
                {' · '}
                <button
                  onClick={() => setSort(null)}
                  className="text-[#564C8E] hover:underline"
                >
                  Limpiar orden
                </button>
              </TableCell>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const name = formatClusterName(c.cluster)
            const isExpanded = expanded === c.cluster
            return (
              <Fragment key={c.cluster}>
                <TableRow
                  className={`${c.sin_cobertura ? 'bg-gray-50' : ''} ${isExpanded ? 'bg-[#F8F7FC]' : ''}`}
                >
                  <TableCell className="px-3 py-2.5">
                    <Checkbox
                      checked={selected.includes(c.cluster)}
                      onCheckedChange={() => onToggle(c.cluster)}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:border-[#564C8E] data-[state=checked]:bg-[#564C8E] data-[state=checked]:text-white data-[state=checked]:[&>svg]:text-white"
                    />
                  </TableCell>
                  <TableCell
                    className="cursor-pointer px-3 py-2.5 text-xs font-medium transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}
                  >
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-[#564C8E]" /> : <ChevronRight className="h-3 w-3 text-gray-300" />}
                      {name}
                      {c.sin_cobertura && (
                        <span title="Sin cobertura">
                          <WifiOff className="h-3 w-3 text-red-400" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-right text-xs tabular-nums transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    {formatNumber(c.n_usuarios_total)}
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-xs tabular-nums transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-10 rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.round(c.score_riesgo * 100)}%`,
                            backgroundColor: c.score_riesgo > 0.6 ? '#EF4444' : c.score_riesgo > 0.45 ? '#EAB308' : '#22C55E',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500">{c.score_riesgo.toFixed(3)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-xs transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    {c.pct_legacy_tech > 0 ? (
                      <span>{calidadLabel(c.pct_legacy_tech)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-xs transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    {c.congestion_media > 0 ? (
                      <span>{congestionLabel(c.congestion_media)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-xs transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    <div className="flex items-center gap-1">
                      {c.nivel_riesgo === 'ALTO' ? (
                        <Badge variant="outline" className="inline-flex items-center gap-1 border-red-300 bg-red-50 text-red-700 rounded-full px-2 py-0.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Alto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="inline-flex items-center gap-1 border-yellow-300 bg-yellow-50 text-yellow-700 rounded-full px-2 py-0.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                          Medio
                        </Badge>
                      )}
                      <span className="group relative inline-flex cursor-help">
                        <Info className="h-3 w-3 text-gray-400" />
                        <span className="absolute bottom-full left-1/2 z-10 mb-1 w-48 -translate-x-1/2 rounded-md border bg-white px-2 py-1 text-[11px] text-gray-600 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          Score {c.score_riesgo.toFixed(3)}.<br />{riskInfo}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="cursor-pointer px-3 py-2.5 text-xs transition-colors hover:text-[#564C8E]"
                    onClick={() => handleRowClick(c.cluster)}>
                    {c.sin_cobertura ? (
                      <span className="font-medium text-red-500">Sin cobertura</span>
                    ) : (
                      <span className="text-gray-700">{generarAccion(c)}</span>
                    )}
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-[#F8F7FC]">
                    <TableCell colSpan={8} className="p-0">
                      <RowDetail cluster={c} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}


