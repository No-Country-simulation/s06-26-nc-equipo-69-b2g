import { useState, useEffect, useRef } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ClusterFilters from '../components/ClusterFilters'
import ClusterTable from '../components/ClusterTable'
import AIResponse from '../components/AIResponse'
import { askTerritorio } from '@/features/ai-chat/api/datosService'
import { getClusters } from '@/features/map-page/api/mapaService'
import { exportComparisonReport } from '@/shared/lib/pdfReport'
import useAuthStore from '@/features/auth/store/useAuthStore'
import { signInWithGoogle } from '@/features/auth/lib/googleAuth'

function formatClusterName(name) {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' · ')
}

function buildPrompt(clusterNames) {
  const names = clusterNames.map(formatClusterName)
  if (names.length === 1) {
    return `Analizar la zona ${names[0]}: ¿cuál es su nivel de riesgo de exclusión digital y qué factores lo impulsan? Usar SIEMPRE el nombre amigable "${names[0]}" en la tabla y en el texto. NO usar identificadores internos como ${clusterNames[0]}. Responder en el mismo idioma de la pregunta (por defecto español). Responder con una tabla comparativa en markdown que muestre las métricas principales (Score, Usuarios, Infraestructura, Concentración, Vulnerabilidad, Congestión, Nivel de riesgo), seguido de un análisis breve y una sugerencia estratégica.`
  }
  return `Comparar EXACTAMENTE las siguientes ${names.length} zonas: ${names.join(', ')}. Es OBLIGATORIO: (1) responder en el mismo idioma de la pregunta (por defecto español), (2) incluir TODAS las zonas en la tabla comparativa en formato markdown (Score, Usuarios, Infraestructura, Concentración, Vulnerabilidad, Congestión, Nivel de riesgo), (3) usar SIEMPRE los nombres amigables (${names.join(', ')}) en la tabla y en el texto, (4) NO usar identificadores internos como ${clusterNames.join(', ')}. Después de la tabla, incluir un análisis breve de diferencias clave y una sugerencia estratégica.`
}

/** Maps API failures to user-facing Spanish copy — raw fetch errors never reach the UI. */
function friendlyAiError(err) {
  if (err?.status === 401 || err?.status === 403) {
    return 'Necesitás iniciar sesión para usar la comparación con IA.'
  }
  return 'No pudimos generar la comparación en este momento. Intentá de nuevo en unos segundos.'
}

export default function ClusterComparisonPage() {
  const user = useAuthStore((s) => s.user)
  const [selected, setSelected] = useState([])
  const [activeFilters, setActiveFilters] = useState(['ALTO', 'MEDIO'])
  const [search, setSearch] = useState('')

  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showResponse, setShowResponse] = useState(false)
  // Zones snapshotted when the AI request fires, so the PDF export always
  // matches what the analysis talks about (not the live filter/selection).
  const [comparedClusters, setComparedClusters] = useState([])
  const [loadingMessage, setLoadingMessage] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const loadingTimerRef = useRef(null)
  const responseRef = useRef(null)

  // The result renders below the table: when a comparison fires, bring the
  // response container into view so the user never has to hunt for it.
  useEffect(() => {
    if (showResponse && aiLoading) {
      responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showResponse, aiLoading])

  useEffect(() => {
    if (!aiLoading) {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
      return
    }

    const count = selected.length
    const messages = [
      `Analizando ${count} ${count === 1 ? 'zona' : 'zonas'} seleccionadas...`,
      'Consultando métricas de riesgo territorial...',
      'Procesando datos de infraestructura y conectividad...',
      'Cruzando indicadores de vulnerabilidad social...',
      'La IA está generando el análisis comparativo...',
      'Preparando la tabla de resultados...',
      'Estimando tiempos de respuesta por zona...',
      'La IA está redactando las recomendaciones...',
    ]

    let idx = 0

    loadingTimerRef.current = setInterval(() => {
      idx = (idx + 1) % messages.length
      setLoadingMessage(messages[idx])
    }, 5000)

    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }
  }, [aiLoading, selected.length])

  const handleToggle = (name) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleToggleAll = (names) => {
    setSelected((prev) => {
      const allSelected = names.every((n) => prev.includes(n))
      if (allSelected) {
        return prev.filter((n) => !names.includes(n))
      }
      return [...new Set([...prev, ...names])]
    })
  }

  const handleToggleFilter = (id) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleClearAll = () => {
    setSearch('')
    setActiveFilters(['ALTO', 'MEDIO'])
  }

  const handleAskAI = async (clusters = null) => {
    const targetClusters = clusters || selected
    if (targetClusters.length === 0) return

    // Auth gate: the AI comparison spends credits and requires a session.
    // Send the user to Google sign-in instead of letting /datos fail with 401.
    if (!user) {
      toast.info('Iniciá sesión con Google para comparar zonas con IA')
      signInWithGoogle()
      return
    }

    setAiLoading(true)
    setAiError(null)
    setShowResponse(true)
    setComparedClusters(targetClusters)
    setLoadingMessage(`Analizando ${targetClusters.length} ${targetClusters.length === 1 ? 'zona' : 'zonas'} seleccionadas...`)

    try {
      const data = await askTerritorio(buildPrompt(targetClusters), { regions: targetClusters })
      setAiResponse(data)
    } catch (err) {
      console.error('AI request failed:', err)
      setAiError(friendlyAiError(err))
    } finally {
      setAiLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (exportingPdf) return
    setExportingPdf(true)

    try {
      const geojson = await getClusters()
      const rows = (geojson.features || [])
        .map((f) => ({ ...f.properties }))
        .filter((c) => comparedClusters.includes(c.cluster))
      rows.sort((a, b) => (b.score_riesgo ?? 0) - (a.score_riesgo ?? 0))

      exportComparisonReport({ clusters: rows, aiResponse })
    } catch (err) {
      console.error('Error exporting comparison report:', err)
      toast.error('No se pudo generar el reporte')
    } finally {
      setExportingPdf(false)
    }
  }

  const selectedNames = selected
    .map((n) => formatClusterName(n))
    .slice(0, 3)
    .join(' · ')

  const remaining = selected.length > 3 ? ` · +${selected.length - 3} más` : ''

  return (
    <main className="min-h-full bg-[#F2F3F1] px-4 py-8 sm:px-6 md:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-xl font-bold text-[#21262B]">Comparar zonas priorizadas</h1>
          <p className="text-sm text-[#5B6269]">
            Zonas ordenadas por riesgo territorial calculado · Dataset CDRView · jun/2026 · ventana de 15 días
          </p>
        </div>
        <section className="rounded-2xl border border-[#E2E4DF] bg-white p-4 shadow-[0_1px_2px_rgba(20,30,35,0.07)] sm:p-5">
          <ClusterFilters
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            search={search}
            onSearchChange={setSearch}
            onClearAll={handleClearAll}
          />

          {/* Action bar above the table so the primary CTA is visible without scrolling */}
          <div className="mb-4 rounded-xl border border-[#E2E4DF] bg-[#F9FAF8] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {selected.length > 0
                    ? `${selected.length} ${selected.length === 1 ? 'zona seleccionada' : 'zonas seleccionadas'}`
                    : 'Ninguna zona seleccionada'}
                </span>
                {selected.length > 0 && (
                  <>
                    <span className="text-sm text-gray-400">·</span>
                    <span className="text-sm text-gray-400">{selectedNames}{remaining}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskAI()}
                  disabled={selected.length === 0 || aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#564C8E' }}
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                  {aiLoading ? loadingMessage : 'Comparar con IA'}
                </button>
              </div>
            </div>
          </div>

          <ClusterTable
            selected={selected}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
            activeFilters={activeFilters}
            search={search}
            onAskAI={handleAskAI}
          />
        </section>

        {showResponse && (
          <div ref={responseRef} className="mt-3 scroll-mt-4">
            <AIResponse
              response={aiResponse}
              loading={aiLoading}
              error={aiError}
              selectedClusters={comparedClusters}
              onExport={handleExportPdf}
              exporting={exportingPdf}
              onClose={() => {
                setShowResponse(false)
                setAiResponse(null)
                setAiError(null)
                setComparedClusters([])
              }}
            />
          </div>
        )}

        <p className="mt-2 text-xs text-[#8A9197]">
          Calidad de red y congestión son estimaciones derivadas de la actividad de antenas (CDRView), no mediciones oficiales de campo.
        </p>
      </div>
    </main>
  )
}
