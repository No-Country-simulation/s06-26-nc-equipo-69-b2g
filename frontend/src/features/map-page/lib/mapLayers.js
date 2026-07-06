import { getConcentracao, getClusters, getEquipamentosPublicos, getOD } from '../api/mapaService'
import { buildClusterDetail } from './clusterDetail'

export const filterLayerMap = {
  concentracion: ['concentracion-heatmap-layer'],
  antenas: ['antenas-layer'],
  clusters: ['clusters-layer', 'clusters-outline', 'clusters-sin-cobertura', 'clusters-labels', 'clusters-card-highlight', 'clusters-ia-highlight'],
  corredores: ['corredores-layer'],
  instituciones: ['instituciones-layer', 'instituciones-labels'],
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
  const geojson = await getConcentracao(periodo)

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
      // Radius and intensity must grow with zoom, otherwise the heatmap
      // visually dissolves as points spread apart on screen
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, 0.8,
        13, 2,
      ],
      'heatmap-radius': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        8, 14,
        11, 34,
        14, 80,
      ],
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

const ANTENA_ICON_ID = 'antena-icon'

// Classic broadcast icon: mast + radio waves, white halo for map contrast
const ANTENA_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <g stroke="#ffffff" stroke-width="10" stroke-linecap="round" fill="none" opacity="0.9">
    <path d="M28 50 V27"/>
    <path d="M18 21 a14 14 0 0 1 20 0"/>
    <path d="M11 14 a24 24 0 0 1 34 0"/>
  </g>
  <g stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" fill="none">
    <path d="M28 50 V27"/>
    <path d="M18 21 a14 14 0 0 1 20 0"/>
    <path d="M11 14 a24 24 0 0 1 34 0"/>
  </g>
  <circle cx="28" cy="27" r="5" fill="#0f172a" stroke="#ffffff" stroke-width="2.5"/>
</svg>`

function loadAntenaIcon(map) {
  if (map.hasImage(ANTENA_ICON_ID)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const img = new Image(56, 56)
    img.onload = () => {
      if (!map.hasImage(ANTENA_ICON_ID)) {
        map.addImage(ANTENA_ICON_ID, img, { pixelRatio: 2 })
      }
      resolve()
    }
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ANTENA_ICON_SVG)}`
  })
}

/**
 * Each feature of /mapa/concentracao is one antenna (unique ecgi), so the
 * antenna layer reuses the concentracion source instead of a separate dataset.
 */
export async function addAntenasLayer(map) {
  await loadAntenaIcon(map)

  map.addLayer({
    id: 'antenas-layer',
    type: 'symbol',
    source: 'concentracion-heatmap',
    layout: {
      'icon-image': ANTENA_ICON_ID,
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9, 0.7,
        13, 1.15,
      ],
      'icon-allow-overlap': true,
    },
  })
}

const PERIODO_LABELS = {
  MADRUGADA: 'Madrugada',
  MANHA: 'Mañana',
  TARDE: 'Tarde',
  NOITE: 'Noche',
}

function antenaTooltipHtml(props) {
  const { cluster, municipio, n_usuarios, congestion_media, drop_pct_media } = props
  return `
    <div style="font-family: inherit; font-size: 11px; line-height: 1.5; min-width: 150px;">
      <strong style="font-size: 12px;">${(cluster ?? '').replace(/_/g, ' ')}</strong>
      <span style="color: #6b7280;"> · ${municipio ?? ''}</span>
      <div style="margin-top: 4px; display: grid; grid-template-columns: auto auto; gap: 0 12px;">
        <span style="color:#6b7280">Usuarios</span><span style="text-align:right; font-weight:600">${Number(n_usuarios ?? 0).toLocaleString('es')}</span>
        <span style="color:#6b7280">Congestión</span><span style="text-align:right; font-weight:600">${((congestion_media ?? 0) * 100).toFixed(1)}%</span>
        <span style="color:#6b7280">Drop</span><span style="text-align:right; font-weight:600">${((drop_pct_media ?? 0) * 100).toFixed(2)}%</span>
      </div>
    </div>
  `
}

function corredorTooltipHtml(props) {
  const { cluster_origem, cluster_destino, n_viagens, n_usuarios, dist_media_km, periodo_predominante } = props
  return `
    <div style="font-family: inherit; font-size: 11px; line-height: 1.5; min-width: 170px;">
      <p style="margin:0 0 2px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#0891b2;">Corredor de movilidad</p>
      <strong style="font-size: 12px;">${(cluster_origem ?? '').replace(/_/g, ' ')} → ${(cluster_destino ?? '').replace(/_/g, ' ')}</strong>
      <div style="margin-top: 4px; display: grid; grid-template-columns: auto auto; gap: 0 12px;">
        <span style="color:#6b7280">Viajes (15 días)</span><span style="text-align:right; font-weight:600">${Number(n_viagens ?? 0).toLocaleString('es')}</span>
        <span style="color:#6b7280">Personas</span><span style="text-align:right; font-weight:600">${Number(n_usuarios ?? 0).toLocaleString('es')}</span>
        <span style="color:#6b7280">Distancia media</span><span style="text-align:right; font-weight:600">${Number(dist_media_km ?? 0).toFixed(1)} km</span>
        <span style="color:#6b7280">Período principal</span><span style="text-align:right; font-weight:600">${PERIODO_LABELS[periodo_predominante] ?? periodo_predominante ?? '—'}</span>
      </div>
    </div>
  `
}

const INSTITUCION_CATEGORY_LABELS = {
  salud: 'Salud',
  educacion: 'Educación',
  asistencia: 'Asistencia',
  gobierno: 'Gobierno',
}

const INSTITUCION_ICON_IDS = {
  salud: 'institucion-salud-icon',
  educacion: 'institucion-educacion-icon',
  asistencia: 'institucion-asistencia-icon',
  gobierno: 'institucion-gobierno-icon',
  default: 'institucion-default-icon',
}

function buildInstitutionIconSvg({ color, body }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <circle cx="28" cy="28" r="23" fill="#ffffff" opacity="0.96"/>
  <circle cx="28" cy="28" r="19" fill="${color}" stroke="#ffffff" stroke-width="3"/>
  <g fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </g>
</svg>`
}

const INSTITUCION_ICON_SVGS = {
  [INSTITUCION_ICON_IDS.salud]: buildInstitutionIconSvg({
    color: '#ef4444',
    body: '<path d="M28 17v22"/><path d="M17 28h22"/>',
  }),
  [INSTITUCION_ICON_IDS.educacion]: buildInstitutionIconSvg({
    color: '#2563eb',
    body: '<path d="M16 20h9c2 0 3 1 3 3v16c0-2-1-3-3-3h-9z"/><path d="M40 20h-9c-2 0-3 1-3 3v16c0-2 1-3 3-3h9z"/>',
  }),
  [INSTITUCION_ICON_IDS.asistencia]: buildInstitutionIconSvg({
    color: '#16a34a',
    body: '<path d="M18 32c4 5 10 8 10 8s6-3 10-8"/><path d="M19 25c0-4 5-6 9-1 4-5 9-3 9 1 0 6-9 11-9 11s-9-5-9-11z"/>',
  }),
  [INSTITUCION_ICON_IDS.gobierno]: buildInstitutionIconSvg({
    color: '#7c3aed',
    body: '<path d="M17 25h22"/><path d="M19 39h18"/><path d="M21 25v14"/><path d="M28 25v14"/><path d="M35 25v14"/><path d="M16 22l12-7 12 7z"/>',
  }),
  [INSTITUCION_ICON_IDS.default]: buildInstitutionIconSvg({
    color: '#64748b',
    body: '<path d="M28 18v20"/><path d="M20 26h16"/><path d="M20 38h16"/>',
  }),
}

function loadSvgIcon(map, iconId, svg) {
  if (map.hasImage(iconId)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const img = new Image(56, 56)
    img.onload = () => {
      if (!map.hasImage(iconId)) {
        map.addImage(iconId, img, { pixelRatio: 2 })
      }
      resolve()
    }
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

function loadInstitucionIcons(map) {
  return Promise.all(
    Object.entries(INSTITUCION_ICON_SVGS).map(([iconId, svg]) => loadSvgIcon(map, iconId, svg))
  )
}

function escapeHtml(value = '') {
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function institucionTooltipHtml(props) {
  const categoria = props.categoria ?? ''
  const categoryLabel = INSTITUCION_CATEGORY_LABELS[categoria] ?? categoria ?? 'Institución'
  return `
    <div style="font-family: inherit; font-size: 11px; line-height: 1.5; min-width: 170px;">
      <p style="margin:0 0 2px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#2563eb;">Institución pública</p>
      <strong style="display:block; font-size: 12px; color:#111827;">${escapeHtml(props.nome ?? 'Sin nombre')}</strong>
      <div style="margin-top: 4px; display: grid; grid-template-columns: auto auto; gap: 0 12px;">
        <span style="color:#6b7280">Categoría</span><span style="text-align:right; font-weight:600">${escapeHtml(categoryLabel)}</span>
        <span style="color:#6b7280">Tipo</span><span style="text-align:right; font-weight:600">${escapeHtml(props.tipo ?? '—')}</span>
      </div>
    </div>
  `
}

export async function addInstitucionesSourceAndLayer(map) {
  await loadInstitucionIcons(map)

  const geojson = await getEquipamentosPublicos()

  geojson.features.forEach((feature) => {
    const categoria = feature.properties?.categoria
    feature.properties.categoria_label = INSTITUCION_CATEGORY_LABELS[categoria] ?? categoria ?? 'Institución'
  })

  map.addSource('instituciones', {
    type: 'geojson',
    data: geojson,
  })

  map.addLayer({
    id: 'instituciones-layer',
    type: 'symbol',
    source: 'instituciones',
    layout: {
      'icon-image': [
        'match',
        ['get', 'categoria'],
        'salud', INSTITUCION_ICON_IDS.salud,
        'educacion', INSTITUCION_ICON_IDS.educacion,
        'asistencia', INSTITUCION_ICON_IDS.asistencia,
        'gobierno', INSTITUCION_ICON_IDS.gobierno,
        INSTITUCION_ICON_IDS.default,
      ],
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9, 0.55,
        13, 0.78,
        15, 1,
      ],
      'icon-allow-overlap': false,
      'icon-ignore-placement': false,
      'icon-padding': 4,
    },
  })

  map.addLayer({
    id: 'instituciones-labels',
    type: 'symbol',
    source: 'instituciones',
    minzoom: 13.75,
    layout: {
      'text-field': ['get', 'categoria_label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13.75, 9, 16, 11],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-offset': [0, 1.35],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-optional': true,
      'text-padding': 4,
    },
    paint: {
      'text-color': '#1f2937',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.2,
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

export async function addCorredoresSourceAndLayer(map) {
  const odGeojson = await getOD()

  const sorted = [...odGeojson.features]
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

// Bubble radius driven by score_riesgo, scaled down at low zoom so the
// metro-wide view doesn't collapse into overlapping blobs downtown
const CLUSTER_RADIUS = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9, ['interpolate', ['linear'], ['get', 'score_riesgo'], 0, 7, 1, 20],
  13, ['interpolate', ['linear'], ['get', 'score_riesgo'], 0, 16, 1, 48],
]

export async function addClustersSourceAndLayer(map) {
  const geojson = await getClusters()

  // Human-readable label (Mapbox expressions cannot replace substrings)
  geojson.features.forEach((f) => {
    f.properties.cluster_label = (f.properties.cluster ?? '').replace(/_/g, ' ')
  })

  map.addSource('clusters', {
    type: 'geojson',
    data: geojson,
  })

  map.addLayer({
    id: 'clusters-layer',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': CLUSTER_RADIUS,
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
      'circle-radius': CLUSTER_RADIUS,
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

  // Purple ring around zones that only have a detail card open (not chat
  // context). Added before the blue ring so blue wins when a zone is both.
  map.addLayer({
    id: 'clusters-card-highlight',
    type: 'circle',
    source: 'clusters',
    filter: ['in', ['get', 'cluster'], ['literal', []]],
    paint: {
      'circle-radius': CLUSTER_RADIUS,
      'circle-color': 'transparent',
      'circle-stroke-color': '#a855f7',
      'circle-stroke-width': 3,
      'circle-pitch-alignment': 'map',
    },
  })

  // Blue ring around zones in the chat context / highlighted by the AI.
  // Starts matching nothing; updateIaHighlight() drives the filter.
  map.addLayer({
    id: 'clusters-ia-highlight',
    type: 'circle',
    source: 'clusters',
    filter: ['in', ['get', 'cluster'], ['literal', []]],
    paint: {
      'circle-radius': CLUSTER_RADIUS,
      'circle-color': 'transparent',
      'circle-stroke-color': '#3b82f6',
      'circle-stroke-width': 3,
      'circle-pitch-alignment': 'map',
    },
  })

  map.addLayer({
    id: 'clusters-labels',
    type: 'symbol',
    source: 'clusters',
    minzoom: 9.5,
    layout: {
      'text-field': ['get', 'cluster_label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 9.5, 9, 13, 12],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#374151',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.2,
    },
  })
}

// Paint overrides that keep the data layers readable on the dark 3D dusk
// basemap: the default cyan corridors and muted risk fills sink into it.
// Layers are recreated with their light-style defaults on every style switch,
// so only the dusk theme needs explicit values; guards make it safe for
// lazily-added layers (corredores).
const DUSK_LAYER_PAINT = {
  'corredores-layer': {
    'line-color': '#67e8f9',
    'line-opacity': 0.85,
    'line-width': ['interpolate', ['linear'], ['get', 'n_viagens'], 0, 1.2, 28288, 4],
  },
  'clusters-layer': {
    'circle-opacity': 0.55,
    'circle-color': [
      'match',
      ['get', 'nivel_riesgo'],
      'ALTO', '#ef4444',
      'MEDIO', '#fbbf24',
      'BAJO', '#34d399',
      '#cbd5e1',
    ],
    'circle-stroke-color': [
      'match',
      ['get', 'nivel_riesgo'],
      'ALTO', '#fca5a5',
      'MEDIO', '#fde047',
      'BAJO', '#6ee7b7',
      '#e5e7eb',
    ],
    'circle-stroke-width': 2.5,
  },
  'clusters-outline': {
    'circle-stroke-color': [
      'match',
      ['get', 'nivel_riesgo'],
      'ALTO', '#f87171',
      'MEDIO', '#fde047',
      'BAJO', '#6ee7b7',
      '#e5e7eb',
    ],
    'circle-opacity': 0.9,
  },
  'clusters-labels': {
    'text-color': '#f9fafb',
    'text-halo-color': 'rgba(15, 23, 42, 0.85)',
    'text-halo-width': 1.4,
  },
}

export function applyDataLayerTheme(map, theme) {
  if (theme !== 'dusk') return
  for (const [layerId, props] of Object.entries(DUSK_LAYER_PAINT)) {
    if (!map.getLayer(layerId)) continue
    for (const [prop, value] of Object.entries(props)) {
      map.setPaintProperty(layerId, prop, value)
    }
  }
}

export async function addAllSourcesAndLayers(map, activeFilters = [], periodo = 'MANHA') {
  await addConcentracionSourceAndLayer(map, periodo)
  await addAntenasLayer(map)
  await addClustersSourceAndLayer(map)
  try {
    await addInstitucionesSourceAndLayer(map)
  } catch (err) {
    console.warn('Could not load public institutions layer:', err)
  }
  updateLayerVisibility(map, activeFilters)
}

export async function ensureCorredoresLoaded(map, activeFilters) {
  if (activeFilters.includes('corredores') && !map.getSource('corredores')) {
    await addCorredoresSourceAndLayer(map)
  }
}

/** Ring the zones the AI highlighted; an empty list clears the highlight. */
export function updateIaHighlight(map, clusterNames = []) {
  if (!map.getLayer('clusters-ia-highlight')) return
  map.setFilter('clusters-ia-highlight', ['in', ['get', 'cluster'], ['literal', clusterNames]])
}

/** Ring the zones that only have a detail card open (purple, no chat). */
export function updateCardHighlight(map, clusterNames = []) {
  if (!map.getLayer('clusters-card-highlight')) return
  map.setFilter('clusters-card-highlight', ['in', ['get', 'cluster'], ['literal', clusterNames]])
}

const CORREDOR_OPACITY_DEFAULT = 0.5
const CORREDOR_OPACITY_ISOLATED = 0.95

/**
 * Focus a single mobility flow: filter the corridor layer down to the clicked
 * origin→destination pair and emphasize it, so the user can read one line
 * without the other flows overlapping. Passing null restores every corridor.
 */
export function setCorredorIsolation(map, feature = null) {
  if (!map.getLayer('corredores-layer')) return

  if (!feature) {
    map.setFilter('corredores-layer', null)
    map.setPaintProperty('corredores-layer', 'line-opacity', CORREDOR_OPACITY_DEFAULT)
    return
  }

  map.setFilter('corredores-layer', [
    'all',
    ['==', ['get', 'cluster_origem'], feature.properties?.cluster_origem ?? ''],
    ['==', ['get', 'cluster_destino'], feature.properties?.cluster_destino ?? ''],
  ])
  map.setPaintProperty('corredores-layer', 'line-opacity', CORREDOR_OPACITY_ISOLATED)
}

const INTERACTIVE_LAYERS = ['clusters-layer', 'antenas-layer', 'instituciones-layer', 'corredores-layer']

// Touch-friendly hit area: fingers are ~10px less precise than a cursor
const TAP_TOLERANCE_PX = 10

/**
 * Unified tap/click + hover handling for all interactive layers.
 * A single map-level click with a padded hitbox works for touch devices,
 * where per-layer pixel-perfect clicks and hover do not exist.
 * Receives the mapboxgl module because the map component imports it lazily.
 */
export function addMapInteractions(map, mapboxgl, getStoreState) {
  const tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 14,
  })
  const infoPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 14,
  })

  const selectCluster = (clusterName) => {
    const state = getStoreState()

    // Toggle: clicking a zone that is already selected deselects it — closes the
    // card and drops it from the chat context.
    if (state.openZones.some((zone) => zone.code === clusterName)) {
      state.closeZone(clusterName)
      state.removeChatRegion(clusterName)
      return
    }

    const demo = state.demografiaData?.clusters?.[clusterName]
    const props = state.clusterProperties?.[clusterName]
    if (!demo && !props) return

    state.openZone(buildClusterDetail(clusterName, demo, props))
    // The zone only joins the chat context when the chat is open (i.e. the user
    // is actively conversing). Otherwise it is just a detail card.
    if (state.isLeftSidebarOpen) {
      state.setChatContext({ region: clusterName })
    }
  }

  // Restore every corridor when the focused flow's popup is dismissed.
  infoPopup.on('close', () => setCorredorIsolation(map, null))

  map.on('click', (e) => {
    const pad = TAP_TOLERANCE_PX
    const bbox = [
      [e.point.x - pad, e.point.y - pad],
      [e.point.x + pad, e.point.y + pad],
    ]
    const layers = INTERACTIVE_LAYERS.filter((id) => map.getLayer(id))
    const features = map.queryRenderedFeatures(bbox, { layers })
    if (features.length === 0) {
      // Clicking empty map exits the isolated-corridor view.
      setCorredorIsolation(map, null)
      return
    }

    // Prefer a zone/point selection over a corridor line when several are under
    // the tap. Corridors render on top, but clicking a zone bubble should open
    // its detail even when an (isolated) corridor line crosses it. INTERACTIVE_LAYERS
    // is ordered by priority: clusters first, corridors last.
    const feature =
      INTERACTIVE_LAYERS.map((id) => features.find((f) => f.layer.id === id)).find(Boolean) ??
      features[0]

    // Any non-corridor interaction brings the full mobility layer back.
    if (feature.layer.id !== 'corredores-layer') {
      setCorredorIsolation(map, null)
    }

    if (feature.layer.id === 'clusters-layer') {
      const clusterName = feature.properties?.cluster
      if (clusterName) selectCluster(clusterName)
      return
    }

    if (feature.layer.id === 'antenas-layer') {
      tooltip.remove()
      infoPopup
        .setLngLat(feature.geometry.coordinates)
        .setHTML(antenaTooltipHtml(feature.properties))
        .addTo(map)

      const ecgi = feature.properties?.ecgi
      if (ecgi) {
        getStoreState().setChatContext({ ecgi })
        getStoreState().openLeftSidebar()
      }
      return
    }

    if (feature.layer.id === 'instituciones-layer') {
      tooltip.remove()
      infoPopup
        .setLngLat(feature.geometry.coordinates)
        .setHTML(institucionTooltipHtml(feature.properties))
        .addTo(map)
      return
    }

    if (feature.layer.id === 'corredores-layer') {
      tooltip.remove()
      // Open the popup first: reopening it fires a `close` that resets the
      // isolation, so we must isolate AFTER the popup is in place.
      infoPopup
        .setLngLat(e.lngLat)
        .setHTML(corredorTooltipHtml(feature.properties))
        .addTo(map)
      setCorredorIsolation(map, feature)
    }
  })

  // Desktop-only affordances: hover tooltips and pointer cursor
  map.on('mousemove', 'antenas-layer', (e) => {
    const feature = e.features?.[0]
    if (!feature) return
    map.getCanvas().style.cursor = 'pointer'
    tooltip
      .setLngLat(feature.geometry.coordinates)
      .setHTML(antenaTooltipHtml(feature.properties))
      .addTo(map)
  })
  map.on('mouseleave', 'antenas-layer', () => {
    map.getCanvas().style.cursor = ''
    tooltip.remove()
  })

  map.on('mousemove', 'instituciones-layer', (e) => {
    const feature = e.features?.[0]
    if (!feature) return
    map.getCanvas().style.cursor = 'pointer'
    tooltip
      .setLngLat(feature.geometry.coordinates)
      .setHTML(institucionTooltipHtml(feature.properties))
      .addTo(map)
  })
  map.on('mouseleave', 'instituciones-layer', () => {
    map.getCanvas().style.cursor = ''
    tooltip.remove()
  })

  map.on('mousemove', 'corredores-layer', (e) => {
    const feature = e.features?.[0]
    if (!feature) return
    map.getCanvas().style.cursor = 'pointer'
    tooltip
      .setLngLat(e.lngLat)
      .setHTML(corredorTooltipHtml(feature.properties))
      .addTo(map)
  })
  map.on('mouseleave', 'corredores-layer', () => {
    map.getCanvas().style.cursor = ''
    tooltip.remove()
  })

  map.on('mouseenter', 'clusters-layer', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'clusters-layer', () => {
    map.getCanvas().style.cursor = ''
  })
}
