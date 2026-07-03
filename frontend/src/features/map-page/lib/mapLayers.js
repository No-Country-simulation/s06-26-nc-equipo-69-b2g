import { antenas as mockAntenas } from '../data/mockAntenas'

export const filterLayerMap = {
  concentracion: ['concentracion-heatmap-layer'],
  antenas: ['antenas-layer'],
  clusters: ['clusters-layer', 'clusters-outline', 'clusters-sin-cobertura'],
  corredores: ['corredores-layer'],
}

export function updateLayerVisibility(map, activeFilters) {
  Object.entries(filterLayerMap).forEach(([filterId, layerIds]) => {
    const visibility = activeFilters.includes(filterId) ? 'visible' : 'none'
    layerIds.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility)
      }
    })
  })
}

export async function addConcentracionSourceAndLayer(map, periodo = 'MANHA') {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${apiUrl}/api/v1/mapa/concentracao?periodo=${periodo}`)
  const geojson = await res.json()

  map.addSource('concentracion-heatmap', {
    type: 'geojson',
    data: geojson,
  })

  map.addLayer({
    id: 'concentracion-heatmap-layer',
    type: 'heatmap',
    source: 'concentracion-heatmap',
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'n_usuarios'],
        0, 0,
        62834, 1,
      ],
      'heatmap-intensity': 1,
      'heatmap-radius': 30,
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(255,255,255,0)',
        0.2, 'rgba(253,230,138,0.6)',
        0.4, 'rgba(245,158,11,0.7)',
        0.6, 'rgba(234,88,12,0.8)',
        0.8, 'rgba(220,38,38,0.9)',
        1, 'rgba(153,27,27,1)',
      ],
    },
  })
}

export function addAntenasSourceAndLayer(map) {
  // Convert mockAntenas (array) into a GeoJSON FeatureCollection
  map.addSource('antenas', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: mockAntenas.map((a) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
        properties: { ...a },
      })),
    },
  })

  map.addLayer({
    id: 'antenas-layer',
    type: 'circle',
    source: 'antenas',
    paint: {
      'circle-radius': 8,
      'circle-color': '#1a1a1a',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })
}

function buildArcCoordinates(start, end) {
  const midLng = (start[0] + end[0]) / 2
  const midLat = (start[1] + end[1]) / 2
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const dist = Math.sqrt(dx * dx + dy * dy)
  const offset = dist * 0.2
  const perpX = -dy / dist * offset
  const perpY = dx / dist * offset
  const controlLng = midLng + perpX
  const controlLat = midLat + perpY

  const points = []
  const steps = 32
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const invT = 1 - t
    const lng = invT * invT * start[0] + 2 * invT * t * controlLng + t * t * end[0]
    const lat = invT * invT * start[1] + 2 * invT * t * controlLat + t * t * end[1]
    points.push([lng, lat])
  }
  return points
}

let odGeojsonCache = null

export async function addCorredoresSourceAndLayer(map) {
  if (!odGeojsonCache) {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${apiUrl}/api/v1/mapa/od`)
    odGeojsonCache = await res.json()
  }

  const sorted = [...odGeojsonCache.features]
    .sort((a, b) => (b.properties?.n_viagens ?? 0) - (a.properties?.n_viagens ?? 0))

  const topFlows = sorted.slice(0, 40)

  const arcFeatures = topFlows.map((f) => {
    const coords = f.geometry?.coordinates ?? []
    if (coords.length < 2) return null
    const start = coords[0]
    const end = coords[coords.length - 1]
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: buildArcCoordinates(start, end) },
      properties: { ...f.properties },
    }
  }).filter(Boolean)

  if (map.getSource('corredores')) {
    map.getSource('corredores').setData({ type: 'FeatureCollection', features: arcFeatures })
    return
  }

  map.addSource('corredores', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: arcFeatures },
  })

  map.addLayer({
    id: 'corredores-layer',
    type: 'line',
    source: 'corredores',
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['get', 'n_viagens'],
        0, 0.5,
        28288, 2.5,
      ],
      'line-color': '#00bcd4',
      'line-opacity': 0.5,
      'line-dasharray': [4, 3],
      'line-cap': 'round',
      'line-join': 'round',
    },
  })
}

export async function addClustersSourceAndLayer(map) {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${apiUrl}/api/v1/mapa/clusters`)
  const geojson = await res.json()

  map.addSource('clusters', {
    type: 'geojson',
    data: geojson,
  })

  map.addLayer({
    id: 'clusters-layer',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'score_riesgo'],
        0, 12,
        1, 40,
      ],
      'circle-color': [
        'match',
        ['get', 'nivel_riesgo'],
        'ALTO', '#dc2626',
        'MEDIO', '#eab308',
        'BAJO', '#22c55e',
        '#9ca3af',
      ],
      'circle-opacity': 0.4,
      'circle-stroke-color': [
        'match',
        ['get', 'nivel_riesgo'],
        'ALTO', '#991b1b',
        'MEDIO', '#a16207',
        'BAJO', '#15803d',
        '#6b7280',
      ],
      'circle-stroke-width': 2,
      'circle-pitch-alignment': 'map',
    },
  })

  map.addLayer({
    id: 'clusters-outline',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'score_riesgo'],
        0, 12,
        1, 40,
      ],
      'circle-color': 'transparent',
      'circle-stroke-color': [
        'match',
        ['get', 'nivel_riesgo'],
        'ALTO', '#dc2626',
        'MEDIO', '#eab308',
        'BAJO', '#22c55e',
        '#9ca3af',
      ],
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.6,
      'circle-pitch-alignment': 'map',
    },
  })

  map.addLayer({
    id: 'clusters-sin-cobertura',
    type: 'circle',
    source: 'clusters',
    filter: ['==', ['get', 'sin_cobertura'], true],
    paint: {
      'circle-radius': 6,
      'circle-color': '#1e293b',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.9,
    },
  })
}

export async function addAllSourcesAndLayers(map, activeFilters = [], periodo = 'MANHA') {
  await addConcentracionSourceAndLayer(map, periodo)
  addAntenasSourceAndLayer(map)
  await addClustersSourceAndLayer(map)
  updateLayerVisibility(map, activeFilters)
}

export async function ensureCorredoresLoaded(map, activeFilters) {
  if (activeFilters.includes('corredores') && !map.getSource('corredores')) {
    await addCorredoresSourceAndLayer(map)
  }
}

export function addClusterClickHandler(map, getStoreState) {
  map.on('click', 'clusters-layer', (e) => {
    const feature = e.features?.[0]
    if (!feature) return

    const clusterName = feature.properties?.cluster
    if (!clusterName) return

    const { demografiaData, clusterProperties } = getStoreState()
    const demo = demografiaData?.clusters?.[clusterName]
    const props = clusterProperties?.[clusterName]

    if (!demo && !props) return

    const riskLevel = props?.nivel_riesgo?.toUpperCase() ?? 'MEDIO'
    const riskVariant = riskLevel === 'ALTO' ? 'red' : riskLevel === 'MEDIO' ? 'orange' : 'green'
    const riskLabel = `Riesgo ${riskLevel.toLowerCase()} de exclusión digital`

    const income = demo?.income ?? {}
    const ageGroups = demo?.age_groups ?? {}
    const totalIncome = Object.values(income).reduce((a, b) => a + b, 0)

    const incomeLabels = { A: 'Clase A', B: 'Clase B', C: 'Clase C', D: 'Clase D' }
    const incomeBreakdown = Object.entries(income).map(([key, val]) => ({
      label: incomeLabels[key] ?? key,
      value: val,
      pct: totalIncome > 0 ? Math.round((val / totalIncome) * 100) : 0,
    }))

    const ageBreakdown = Object.entries(ageGroups).map(([key, val]) => ({ label: key, value: val }))

    getStoreState().setSelectedCluster({
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
      pct_renda_baja: props?.pct_renda_baja ?? 0,
      congestion_media: props?.congestion_media ?? 0,
      sin_cobertura: props?.sin_cobertura ?? false,
      infra: props?.infra ?? 0,
      incomeBreakdown,
      ageBreakdown,
    })

    getStoreState().setChatContext({ region: clusterName })
    getStoreState().openLeftSidebar()
  })

  map.on('mouseenter', 'clusters-layer', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'clusters-layer', () => {
    map.getCanvas().style.cursor = ''
  })
}
