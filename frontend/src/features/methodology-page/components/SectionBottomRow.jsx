import { CheckCircle, AlertTriangle } from 'lucide-react'

const traceFields = [
  'Datos usados',
  'Fuente',
  'Período',
  'Criterio',
  'Región destacada',
  'Recomendación',
  'Límite del análisis',
]

const limits = [
  'Ventana de 15 días (Dataset CDRView · jun/2026).',
  'Datos sintéticos; calidad y congestión son insertas por modelo.',
  'Conectividad estimada, no medida en campo.',
  'Granularidad por cluster, no por manzana.',
]

export default function SectionBottomRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* 4. How AI responds */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--ai-bg)', border: '1px solid var(--ai-bd)' }}
          >
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--ai)', fontWeight: 600 }}>4</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            4. Cómo responde la IA
          </p>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
          La IA de BiT consulta los datos estructurados del territorio, usa el contexto documento de la metodología
          y responde en lenguaje natural —{' '}
          <strong style={{ color: 'var(--text)', fontStyle: 'italic' }}>siempre citando sus fuentes.</strong>
        </p>

        <button
          className="text-xs font-medium text-left mt-auto"
          style={{
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-ui)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Ver guía de uso de la IA →
        </button>
      </div>

      {/* 5. Traceability */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-bd)' }}
          >
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>5</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            5. Trazabilidad de cada respuesta
          </p>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
          Cada respuesta de la IA incluye trazabilidad completa para garantizar transparencia.
        </p>

        <div className="flex flex-col gap-1.5">
          {traceFields.map((field) => (
            <div key={field} className="flex items-center gap-2">
              <CheckCircle size={13} style={{ color: 'var(--risk-low)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
                {field}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MVP Limits */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--risk-med-bg)', border: '1px solid var(--risk-med-bd)' }}
          >
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--risk-med-text)', fontWeight: 600 }}>6</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            6. Límites del MVP
          </p>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
          Límites que debemos considerar en las respuestas.
        </p>

        <div className="flex flex-col gap-2">
          {limits.map((limit) => (
            <div key={limit} className="flex items-start gap-2">
              <span
                className="mt-0.5 flex-shrink-0 text-xs"
                style={{ color: 'var(--text-3)' }}
              >
                ·
              </span>
              <span className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
                {limit}
              </span>
            </div>
          ))}
        </div>

        <button
          className="text-xs font-medium text-left mt-auto"
          style={{
            color: 'var(--accent-text)',
            fontFamily: 'var(--font-ui)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Ver detalles de alcance →
        </button>
      </div>
    </div>
  )
}