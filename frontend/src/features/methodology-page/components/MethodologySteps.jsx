const steps = [
  {
    label: 'Ingesta',
    code: 'ingest()',
    detail: 'Los registros CDR llegan cifrados via SFTP. Se valida hash SHA-256 y se almacenan en almacenamiento en frío antes del procesamiento.',
  },
  {
    label: 'Anonimización',
    code: 'anonymize()',
    detail: 'Aplicamos k-anonimidad (k ≥ 5) por celda espacial de 100m × 100m. Los IMSI se reemplazan por tokens de sesión de 24h.',
  },
  {
    label: 'Agregación espacial',
    code: 'aggregate()',
    detail: 'Las señales se proyectan en una grilla H3 resolución 8 (~0.74 km²). Cada celda acumula conteo de dispositivos únicos por franja horaria.',
  },
  {
    label: 'Índices de movilidad',
    code: 'mobility_index()',
    detail: 'Se calcula OD (origen-destino) entre celdas usando ventanas de 15 minutos. El índice de flujo normaliza por población IBGE de la celda de origen.',
  },
  {
    label: 'Detección de cuellos de botella',
    code: 'detect_bottlenecks()',
    detail: 'Corredores con flujo > percentil 90 y velocidad < 20% de la mediana histórica se etiquetan como cuellos de botella (alto / medio).',
  },
  {
    label: 'Capa IA',
    code: 'ia_insights()',
    detail: 'Un LLM con acceso al contexto territorial genera recomendaciones sobre el estado actual. Cada conclusión viene trazada a los datos fuente.',
  },
]

export default function MethodologySteps() {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="flex gap-4 items-start p-4 rounded-lg border"
          style={{
            background: 'var(--bit-surface, #FFFFFF)',
            borderColor: 'var(--bit-border, #E2E4DF)',
            boxShadow: 'var(--bit-shadow-sm, 0 1px 2px rgba(20,30,35,0.07))',
          }}
        >
          <span
            className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={{
              background: 'var(--bit-purple, #564C8E)',
              color: '#fff',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {i + 1}
          </span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm" style={{ color: 'var(--bit-text, #21262B)', fontFamily: "'Public Sans', sans-serif" }}>
                {step.label}
              </span>
              <code
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: 'color-mix(in srgb, #564C8E 8%, #FFFFFF)',
                  color: 'var(--bit-purple, #564C8E)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  border: '1px solid color-mix(in srgb, #564C8E 20%, #E2E4DF)',
                }}
              >
                {step.code}
              </code>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--bit-text-2, #5B6269)', fontFamily: "'Public Sans', sans-serif" }}>
              {step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
