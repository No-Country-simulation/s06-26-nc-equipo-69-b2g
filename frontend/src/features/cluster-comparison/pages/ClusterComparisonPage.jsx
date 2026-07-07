import { useState, useEffect, useRef } from 'react'
import { FileDown, Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ClusterFilters from '../components/ClusterFilters'
import ClusterTable from '../components/ClusterTable'
import AIResponse from '../components/AIResponse'
import { askTerritorio } from '@/features/ai-chat/api/datosService'
import { getClusters } from '@/features/map-page/api/mapaService'
import { exportComparisonReport } from '@/shared/lib/pdfReport'

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

export default function ClusterComparisonPage() {
  const [selected, setSelected] = useState([])
  const [activeFilters, setActiveFilters] = useState(['ALTO', 'MEDIO'])
  const [search, setSearch] = useState('')

  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showResponse, setShowResponse] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const loadingTimerRef = useRef(null)

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

    setAiLoading(true)
    setAiError(null)
    setShowResponse(true)
    setLoadingMessage(`Analizando ${targetClusters.length} ${targetClusters.length === 1 ? 'zona' : 'zonas'} seleccionadas...`)

    try {
      const prompt = customPrompt.trim() || buildPrompt(targetClusters)
      const data = await askTerritorio(prompt, { regions: targetClusters })
      setAiResponse(data)
    } catch (err) {
      console.error('AI request failed:', err)
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (exportingPdf) return
    setExportingPdf(true)

    try {
      const geojson = await getClusters()
      const all = (geojson.features || []).map((f) => ({ ...f.properties }))

      let filtered = all.filter((c) => activeFilters.includes(c.nivel_riesgo))
      if (search.trim()) {
        const term = search.toLowerCase()
        filtered = filtered.filter(
          (c) => c.cluster.toLowerCase().includes(term) || (c.municipio || '').toLowerCase().includes(term)
        )
      }

      const rows = selected.length > 0 ? filtered.filter((c) => selected.includes(c.cluster)) : filtered
      rows.sort((a, b) => (b.score_riesgo ?? 0) - (a.score_riesgo ?? 0))

      exportComparisonReport({
        clusters: rows,
        aiResponse: showResponse ? aiResponse : null,
      })
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
          <ClusterTable
            selected={selected}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
            activeFilters={activeFilters}
            search={search}
            onAskAI={handleAskAI}
          />
        </section>

        <div className="mt-3 rounded-xl border border-[#E2E4DF] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
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
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#564C8E]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#564C8E] transition-colors hover:bg-[#564C8E]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                {exportingPdf ? 'Generando...' : 'Exportar PDF'}
              </button>
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
                {aiLoading ? loadingMessage : 'Preguntar a la IA'}
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Escribe tu pregunta sobre las zonas seleccionadas..."
              className="flex-1 rounded-lg border border-[#E2E4DF] bg-[#F5F6F4] px-3 py-1.5 text-xs text-gray-900 placeholder-gray-500 transition-colors focus:border-[#564C8E]/50 focus:bg-white focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selected.length > 0) {
                  handleAskAI()
                }
              }}
            />
          </div>
        </div>

        {showResponse && (
          <div className="mt-3">
            <AIResponse
              response={aiResponse}
              loading={aiLoading}
              error={aiError}
              selectedClusters={selected}
              onClose={() => {
                setShowResponse(false)
                setAiResponse(null)
                setAiError(null)
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
