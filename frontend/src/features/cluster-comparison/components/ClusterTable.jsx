import { useState, useEffect, useMemo } from 'react'
import { Info, WifiOff, SearchX } from 'lucide-react'
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
  if (!n) return '0'
  return n.toLocaleString('pt-BR')
}

function congestionLabel(val) {
  if (val === 0 || val === null) return '—'
  if (val < 0.2) return 'Baja'
  if (val < 0.35) return 'Media'
  return 'Alta'
}

function calidadLabel(pctLegacy) {
  if (pctLegacy === 0 || pctLegacy === null) return '—'
  if (pctLegacy > 0.8) return 'Baja'
  if (pctLegacy > 0.75) return 'Media-baja'
  return 'Media'
}

function generarAccion(cluster) {
  if (cluster.sin_cobertura) return 'Sin cobertura · evaluar expansión'
  if (cluster.score_riesgo > 0.6) return 'Reforzar red · infraestructura primero'
  if (cluster.congestion_media > 0.35) return 'Descongestionar en hora pico'
  if (cluster.pct_legacy_tech > 0.78) return 'Modernizar tecnología legado'
  return 'Monitorear estacionalidad'
}

const riskInfo = 'Score calculado a partir de concentración, congestión, movilidad y conectividad.'

export default function ClusterTable({ selected = [], onToggle, activeFilters = ['ALTO', 'MEDIO'], search = '' }) {
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const filtered = useMemo(() => {
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

    return result
  }, [clusters, activeFilters, search])

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

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <SearchX className="mb-2 h-8 w-8" />
        <p className="text-sm">No se encontraron clusters con los filtros actuales</p>
        {(search || activeFilters.length < 2) && (
          <button
            onClick={() => {
              // limpiar búsqueda y filtros lo maneja el padre via props
            }}
            className="mt-2 text-xs text-[#564C8E] hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E4DF] bg-white shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F5F6F4]">
            <TableHead className="w-10 px-3 py-2.5"></TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Cluster</TableHead>
            <TableHead className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Usuarios</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Score</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Red</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Congestión</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Riesgo</TableHead>
            <TableHead className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const name = formatClusterName(c.cluster)
            return (
              <TableRow key={c.cluster} className={c.sin_cobertura ? 'bg-gray-50' : ''}>
                <TableCell className="px-3 py-2.5">
                  <Checkbox
                    checked={selected.includes(c.cluster)}
                    onCheckedChange={() => onToggle(c.cluster)}
                    className="data-[state=checked]:border-[#564C8E] data-[state=checked]:bg-[#564C8E] data-[state=checked]:text-white data-[state=checked]:[&>svg]:text-white"
                  />
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    {name}
                    {c.sin_cobertura && (
                      <span title="Sin cobertura">
                        <WifiOff className="h-3 w-3 text-red-400" />
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2.5 text-right text-xs tabular-nums">
                  {formatNumber(c.n_usuarios_total)}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs tabular-nums">
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
                <TableCell className="px-3 py-2.5 text-xs">
                  {c.pct_legacy_tech > 0 ? (
                    <span>{calidadLabel(c.pct_legacy_tech)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs">
                  {c.congestion_media > 0 ? (
                    <span>{congestionLabel(c.congestion_media)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2.5 text-xs">
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
                <TableCell className="px-3 py-2.5 text-xs">
                  {c.sin_cobertura ? (
                    <span className="text-red-500 font-medium">Sin cobertura</span>
                  ) : (
                    <span className="text-gray-700">{generarAccion(c)}</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
