import { Loader2, AlertCircle, X, Database, Layers, FileText, FileDown } from 'lucide-react'

function parseInlineMarkdown(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Detect table start: line starts with |
    if (line.startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      // Parse table
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim())
        const dataRows = tableLines.slice(2).map(row =>
          row.split('|').filter(c => c.trim()).map(c => c.trim())
        )

        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-[#E2E4DF]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F5F6F4]">
                  {headerCells.map((cell, j) => (
                    <th key={j} className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-[#E2E4DF]">
                      {parseInlineMarkdown(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, j) => (
                  <tr key={j} className="border-b border-[#E2E4DF] last:border-b-0">
                    {row.map((cell, k) => (
                      <td key={k} className="px-3 py-2 text-gray-800">
                        {parseInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      }
    }

    // Regular paragraph
    if (line) {
      elements.push(
        <p key={`p-${i}`} className="mb-2 last:mb-0">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
    i++
  }

  return elements
}

function formatClusterName(name) {
  return name
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' · ')
}

export default function AIResponse({ response, loading, error, selectedClusters, onClose, onExport, exporting = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#E2E4DF] bg-white p-6 shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#564C8E]" />
          <div>
            <p className="text-sm font-medium text-gray-900">Consultando a la IA...</p>
            <p className="text-xs text-gray-500">Analizando {selectedClusters.length} {selectedClusters.length === 1 ? 'zona' : 'zonas'} seleccionadas</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error al consultar la IA</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!response) return null

  return (
    <div className="rounded-xl border border-[#E2E4DF] bg-white p-6 shadow-[0_1px_2px_rgba(20,30,35,0.07)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#564C8E]/10">
            <span className="text-xs">🤖</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Respuesta de la IA</h3>
            <p className="text-[10px] text-gray-400">Análisis basado en datos CDRView y RAG</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#564C8E]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#564C8E] transition-colors hover:bg-[#564C8E]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              {exporting ? 'Generando...' : 'Exportar PDF'}
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Response Text */}
      <div className="mb-4 rounded-lg bg-[#F8F7FC] p-4 text-sm text-gray-800 leading-relaxed">
        {renderMarkdown(response.respuesta_ia)}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Zonas destacadas */}
        {response.clusters_destacados && response.clusters_destacados.length > 0 && (
          <div className="rounded-lg border border-[#E2E4DF] bg-[#F9FAF8] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <Layers className="h-3 w-3" />
              Zonas destacadas
            </div>
            <div className="flex flex-wrap gap-1">
              {response.clusters_destacados.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full bg-[#564C8E]/10 px-2 py-0.5 text-[10px] font-medium text-[#564C8E]"
                >
                  {formatClusterName(c)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Datos extra */}
        {response.datos_extra && (
          <div className="rounded-lg border border-[#E2E4DF] bg-[#F9FAF8] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <Database className="h-3 w-3" />
              Datos consultados
            </div>
            <div className="space-y-0.5">
              {response.datos_extra.regiones_riesgo && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">{response.datos_extra.regiones_riesgo}</span> zonas en riesgo
                </p>
              )}
              {response.datos_extra.antenas_encontradas && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">{response.datos_extra.antenas_encontradas}</span> antenas encontradas
                </p>
              )}
              {response.datos_extra.chunks_contexto && (
                <p className="text-xs text-gray-700">
                  <span className="font-medium">{response.datos_extra.chunks_contexto}</span> chunks de contexto
                </p>
              )}
            </div>
          </div>
        )}

        {/* Fuentes */}
        {response.fuentes && response.fuentes.length > 0 && (
          <div className="rounded-lg border border-[#E2E4DF] bg-[#F9FAF8] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <FileText className="h-3 w-3" />
              Fuentes
            </div>
            <div className="flex flex-wrap gap-1">
              {response.fuentes.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
