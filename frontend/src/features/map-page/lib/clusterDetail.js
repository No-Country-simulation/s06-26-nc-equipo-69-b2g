const INCOME_LABELS = { A: 'Clase A', B: 'Clase B', C: 'Clase C', D: 'Clase D' }

/**
 * Builds the view model consumed by ClusterDetailSheet from the raw
 * /mapa/clusters properties and the /mapa/demografia entry of a cluster.
 */
export function buildClusterDetail(clusterName, demo, props) {
  const riskLevel = props?.nivel_riesgo?.toUpperCase() ?? 'MEDIO'
  const riskVariant = riskLevel === 'ALTO' ? 'red' : riskLevel === 'MEDIO' ? 'orange' : 'green'
  const riskLabel = `Riesgo ${riskLevel.toLowerCase()} de exclusión digital`

  const income = demo?.income ?? {}
  const ageGroups = demo?.age_groups ?? {}
  const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)

  const incomeBreakdown = Object.entries(income).map(([key, val]) => ({
    label: INCOME_LABELS[key] ?? key,
    value: val,
    pct: totalIncome > 0 ? Math.round((val / totalIncome) * 100) : 0,
  }))

  const ageBreakdown = Object.entries(ageGroups).map(([key, val]) => ({ label: key, value: val }))

  return {
    name: clusterName.replace(/_/g, ' '),
    code: clusterName,
    municipio: props?.municipio ?? '',
    riskLevel,
    riskLabel,
    riskVariant,
    n_assinantes: demo?.n_assinantes ?? 0,
    score_riesgo: props?.score_riesgo ?? 0,
    concentracion: props?.concentracion ?? 0,
    vulnerabilidad: props?.vulnerabilidad ?? 0,
    n_usuarios_total: props?.n_usuarios_total ?? 0,
    pct_legacy_tech: props?.pct_legacy_tech ?? 0,
    // The API returns pct_renta_baja; the sheet view model uses pct_renda_baja.
    pct_renda_baja: props?.pct_renta_baja ?? props?.pct_renda_baja ?? 0,
    congestion_media: props?.congestion_media ?? 0,
    sin_cobertura: props?.sin_cobertura ?? false,
    infra: props?.infra ?? 0,
    incomeBreakdown,
    ageBreakdown,
  }
}
