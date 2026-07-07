const riskBarColor = {
  ALTO: 'bg-red-500',
  MEDIO: 'bg-yellow-500',
  BAJO: 'bg-green-500',
}

function IndexBar({ label, value, colorClass = 'bg-purple-500' }) {
  const pct = Math.min(100, Math.round((value ?? 0) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-white/65 md:text-gray-500">{label}</span>
        <span className="font-bold text-white md:text-gray-900">{pct}<span className="font-normal text-white/45 md:text-gray-400">/100</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10 md:bg-gray-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * Renders the full metrics of a single zone. Extracted from the old
 * ClusterDetailSheet so the multi-zone ZoneDetailStack can reuse it. Header
 * (name + risk badge) is provided by the caller; this is the scrollable body.
 */
export default function ClusterDetailContent({ selectedCluster, scrollAreaRef }) {
  const {
    riskLevel,
    score_riesgo, concentracion, vulnerabilidad, n_usuarios_total,
    pct_legacy_tech, pct_renda_baja, congestion_media, sin_cobertura, infra,
    n_assinantes, incomeBreakdown, ageBreakdown,
  } = selectedCluster

  const scorePct = Math.min(100, Math.round((score_riesgo ?? 0) * 100))

  return (
    <div ref={scrollAreaRef} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
          Riesgo de exclusión digital
        </p>
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-white md:text-gray-900">{scorePct}</span>
          <span className="text-sm text-white/45 md:text-gray-400">/ 100</span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10 md:bg-gray-100">
          <div
            className={`h-full rounded-full ${riskBarColor[riskLevel] ?? 'bg-gray-400'}`}
            style={{ width: `${scorePct}%` }}
          />
        </div>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
          Componentes del riesgo
        </p>
        <div className="space-y-2.5">
          <IndexBar label="Concentración de personas" value={concentracion} />
          <IndexBar label="Vulnerabilidad socioeconómica" value={vulnerabilidad} />
          <IndexBar label="Déficit de infraestructura" value={infra} />
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
          Red y cobertura
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Congestión media de red</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{(congestion_media * 100)?.toFixed?.(1) ?? '—'}%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Dispositivos 2G/3G (legacy)</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{(pct_legacy_tech * 100)?.toFixed?.(1) ?? '—'}%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Población de renta baja</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{(pct_renda_baja * 100)?.toFixed?.(1) ?? '—'}%</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Actividad registrada (15 días)</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{n_usuarios_total?.toLocaleString?.('es') ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Zona sin cobertura</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{sin_cobertura ? 'Sí' : 'No'}</span>
          </div>
        </div>
      </div>

      {n_assinantes > 0 && (
        <div className="border-b border-white/10 px-5 py-4 md:border-gray-100">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Perfil demográfico
          </p>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 md:border-gray-100 md:bg-white">
            <span className="text-xs text-white/55 md:text-gray-500">Total de suscriptores</span>
            <span className="text-sm font-bold text-white md:text-gray-900">{n_assinantes?.toLocaleString?.('es') ?? '—'}</span>
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Distribución por ingreso
          </p>
          <div className="mb-3 space-y-1.5">
            {incomeBreakdown?.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-14 text-[11px] text-white/65 md:text-gray-500">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/10 md:bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-mono text-white/55 md:text-gray-400">{item.pct}%</span>
              </div>
            ))}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/45 md:text-gray-400">
            Distribución por edad
          </p>
          <div className="space-y-1.5">
            {ageBreakdown?.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-3 py-1.5 md:border-gray-100 md:bg-white">
                <span className="text-[11px] text-white/65 md:text-gray-500">{item.label}</span>
                <span className="text-[11px] font-bold text-white md:text-gray-900">{item.value?.toLocaleString?.('es') ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
