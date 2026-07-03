import { corredores } from '../data/mockCorredores'
import { antenas as mockAntenas } from '../data/mockAntenas'

export const filterLayerMap = {
  concentracion: ['concentracion-heatmap-layer'],
  antenas: ['antenas-layer'],
  clusters: ['clusters-layer', 'clusters-outline'],
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

  const features = geojson.features.map((f) => ({
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      ...f.properties,
      weight: (f.properties.n_usuarios ?? 0) / 100000,
    },
  }))

  map.addSource('concentracion-heatmap', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
  })

  map.addLayer({
    id: 'concentracion-heatmap-layer',
    type: 'heatmap',
    source: 'concentracion-heatmap',
    paint: {
      'heatmap-weight': ['get', 'weight'],
      'heatmap-intensity': 1.5,
      'heatmap-radius': 80,
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

export function addCorredoresSourceAndLayer(map) {
  map.addSource('corredores', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: corredores.map((corredor) => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: corredor.coordinates,
        },
        properties: {
          id: corredor.id,
          name: corredor.name,
          tag: corredor.tag,
        },
      })),
    },
  })

  map.addLayer({
    id: 'corredores-layer',
    type: 'line',
    source: 'corredores',
    paint: {
      'line-color': ['match', ['get', 'tag'], 'gargalo', '#dc2626', '#f97316'],
      'line-width': 4,
      'line-opacity': 0.85,
      'line-dasharray': [2, 2],
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
      'circle-radius': 50,
      'circle-color': '#7c3aed',
      'circle-opacity': 0.35,
      'circle-stroke-color': '#7c3aed',
      'circle-stroke-width': 1,
      'circle-pitch-alignment': 'map',
    },
  })

  map.addLayer({
    id: 'clusters-outline',
    type: 'circle',
    source: 'clusters',
    paint: {
      'circle-radius': 10,
      'circle-color': 'transparent',
      'circle-stroke-color': '#7c3aed',
      'circle-stroke-width': 2,
      'circle-opacity': 0.75,
      'circle-pitch-alignment': 'map',
    },
  })
}

export async function addAllSourcesAndLayers(map, activeFilters = [], periodo = 'MANHA') {
  await addConcentracionSourceAndLayer(map, periodo)
  addAntenasSourceAndLayer(map)
  await addClustersSourceAndLayer(map)
  addCorredoresSourceAndLayer(map)
  updateLayerVisibility(map, activeFilters)
}
