export default function SectionRiesgo() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-bd)' }}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>3</span>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            3. Cómo se calcula el riesgo
          </p>
          <p className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
            Score calculado que combina los indicadores en un índice de 0 a 100.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        {/* Risk bands */}
        <div className="flex flex-1 flex-wrap gap-3">
          {/* Low */}
          <div
            className="flex-1 min-w-[100px] rounded-lg p-3"
            style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-bd)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: 'var(--risk-low)' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--risk-low-text)', fontFamily: 'var(--font-ui)' }}>
                Bajo
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--risk-low-text)', fontFamily: 'var(--font-ui)' }}>
              Riesgo bajo
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--risk-low-text)', fontFamily: 'var(--font-data)' }}>
              acota: 0 – 34
            </p>
          </div>

          {/* Medium */}
          <div
            className="flex-1 min-w-[100px] rounded-lg p-3"
            style={{ background: 'var(--risk-med-bg)', border: '1px solid var(--risk-med-bd)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: 'var(--risk-med)' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--risk-med-text)', fontFamily: 'var(--font-ui)' }}>
                Medio
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--risk-med-text)', fontFamily: 'var(--font-ui)' }}>
              Riesgo medio
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--risk-med-text)', fontFamily: 'var(--font-data)' }}>
              acota: 40 – 70
            </p>
          </div>

          {/* High */}
          <div
            className="flex-1 min-w-[100px] rounded-lg p-3"
            style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-bd)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: 'var(--risk-high)' }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--risk-high-text)', fontFamily: 'var(--font-ui)' }}>
                Alto
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--risk-high-text)', fontFamily: 'var(--font-ui)' }}>
              Riesgo alto
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--risk-high-text)', fontFamily: 'var(--font-data)' }}>
              acota: 80 – 100
            </p>
          </div>
        </div>

        {/* Formula */}
        <div
          className="rounded-lg p-3 flex-1"
          style={{ background: 'var(--elev)', border: '1px solid var(--border)', minWidth: 180 }}
        >
          <p
            className="text-xs mb-1"
            style={{ fontFamily: 'var(--font-data)', color: 'var(--text-2)' }}
          >
            score = concentración + congestión
          </p>
          <p
            className="text-xs"
            style={{ fontFamily: 'var(--font-data)', color: 'var(--text-2)' }}
          >
            + movilidad + conectividad
          </p>
          <div
            className="mt-2 pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
              Los umbrales pueden variar según la región y el contexto analizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
