import { useEffect, useRef, useState } from 'react'
import { getClusters, getConcentracao, getDemografia } from '../api/mapaService'
import { addAllSourcesAndLayers, addMapInteractions, applyDataLayerTheme, ensureCorredoresLoaded, updateCardHighlight, updateIaHighlight, updateLayerVisibility } from '../lib/mapLayers'
import useMapPageStore from '../store/useMapPageStore'

const token = import.meta.env.VITE_API_KEY_MAPBOX
const useMapbox = import.meta.env.VITE_USE_MAPBOX === 'true'

// Two base map modes: the flat light dashboard look and the Mapbox Standard
// 3D style with dusk lighting (3D buildings + atmosphere). Custom data layers
// are re-added after every style switch because setStyle wipes them.
const MAP_STYLES = {
  light: {
    style: 'mapbox://styles/mapbox/light-v11',
    camera: { pitch: 0, bearing: 0, duration: 900 },
  },
  dusk3d: {
    style: 'mapbox://styles/mapbox/standard',
    camera: { pitch: 55, bearing: -17, duration: 1600 },
  },
}

// In 3D mode the basemap lighting follows the selected data period, so the
// city looks like the time window being analyzed.
const LIGHT_PRESET_BY_PERIODO = {
  MADRUGADA: 'night',
  MANHA: 'dawn',
  TARDE: 'day',
  NOITE: 'dusk',
}

export default function MapboxMap({ selectedPeriodo }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const activeFilters = useMapPageStore((s) => s.activeFilters)
  const highlightedClusters = useMapPageStore((s) => s.highlightedClusters)
  const openZones = useMapPageStore((s) => s.openZones)
  const demografiaData = useMapPageStore((s) => s.demografiaData)
  const clusterProperties = useMapPageStore((s) => s.clusterProperties)
  const setDemografiaData = useMapPageStore((s) => s.setDemografiaData)
  const setClusterProperties = useMapPageStore((s) => s.setClusterProperties)
  const getStoreState = useMapPageStore.getState
  const [tokenError, setTokenError] = useState(useMapbox && !token)
  const [mapError, setMapError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [styleMode, setStyleMode] = useState('light')
  const appliedStyleModeRef = useRef('light')
  const selectedPeriodoRef = useRef(selectedPeriodo)

  useEffect(() => {
    selectedPeriodoRef.current = selectedPeriodo
  }, [selectedPeriodo])

  const updateVisibility = (map) => {
    updateLayerVisibility(map, activeFilters)
  }

  useEffect(() => {
    if (!useMapbox || tokenError || !mapContainer.current) return

    let map
    let cancelled = false
    let resizeObserver
    let resizeFrame
    let resizeTimeout

    const requestMapResize = () => {
      if (!map || cancelled) return

      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame)
      }

      resizeFrame = window.requestAnimationFrame(() => {
        if (!cancelled) {
          map.resize()
        }
      })
    }

    const showMapError = (message) => {
      setMapError((currentMessage) => currentMessage ?? message)
    }

    const initializeMap = async () => {
      try {
        const [{ default: mapboxgl }] = await Promise.all([
          import('mapbox-gl'),
          import('mapbox-gl/dist/mapbox-gl.css'),
        ])

        if (cancelled || !mapContainer.current) {
          return
        }

        mapboxgl.accessToken = token
        setMapError(null)
        // Whole Florianópolis metro region visible on first load
        map = new mapboxgl.Map({
          container: mapContainer.current,
          style: MAP_STYLES.light.style,
          center: [-48.6, -27.5],
          zoom: 9,
        })

        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

        requestMapResize()
        resizeTimeout = window.setTimeout(requestMapResize, 250)

        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(requestMapResize)
          resizeObserver.observe(mapContainer.current)
        } else {
          window.addEventListener('resize', requestMapResize)
        }

        map.on('load', async () => {
          mapRef.current = map
          getStoreState().setMapInstance(map)
          setLoaded(true)
          requestMapResize()

          try {
            await addAllSourcesAndLayers(map, activeFilters, selectedPeriodo)
          } catch (err) {
            console.warn('Could not load map layers:', err)
            showMapError('No se pudieron cargar los datos del mapa. Verificá la conexión con la API e intentá de nuevo.')
            return
          }

          addMapInteractions(map, mapboxgl, getStoreState)

          if (!demografiaData) {
            try {
              setDemografiaData(await getDemografia())
            } catch (err) {
              console.warn('Could not load demografia data:', err)
            }
          }

          if (!clusterProperties) {
            try {
              const clustersJson = await getClusters()
              const propsMap = {}
              clustersJson.features.forEach((f) => {
                const name = f.properties?.cluster
                if (name) {
                  const [lng, lat] = f.geometry?.coordinates ?? []
                  propsMap[name] = { ...f.properties, lng, lat }
                }
              })
              setClusterProperties(propsMap)
            } catch (err) {
              console.warn('Could not load cluster properties:', err)
            }
          }
        })

        map.on('style.load', () => {
          requestMapResize()
          updateVisibility(map)
        })

        map.on('error', (e) => {
          if (e.error && ([401, 403].includes(e.error.status) || e.error.message?.includes('401') || e.error.message?.includes('403'))) {
            setTokenError(true)
            return
          }

          showMapError(e.error?.message ?? 'No se pudo cargar el estilo o los datos del mapa.')
        })
      } catch (err) {
        showMapError(err?.message ?? 'No se pudo inicializar Mapbox.')
      }
    }

    initializeMap()

    return () => {
      cancelled = true
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame)
      }
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', requestMapResize)
      }
      if (map) {
        getStoreState().setMapInstance(null)
        map.remove()
      }
    }
  }, [tokenError])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const map = mapRef.current
    updateVisibility(map)
    // Corredores load lazily: re-apply the dusk paint if they appear while 3D.
    ensureCorredoresLoaded(map, activeFilters).then(() => {
      applyDataLayerTheme(map, appliedStyleModeRef.current === 'dusk3d' ? 'dusk' : 'light')
    })
  }, [activeFilters, loaded])

  // Base style switch (2D light <-> 3D dusk). setStyle drops every custom
  // source/layer, so they are re-added once the new style finishes loading;
  // layer-scoped interactions survive because they are bound by layer id.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return

    if (appliedStyleModeRef.current === styleMode) return
    appliedStyleModeRef.current = styleMode

    const def = MAP_STYLES[styleMode]
    const styleOptions =
      styleMode === 'dusk3d'
        ? {
            config: {
              basemap: {
                lightPreset: LIGHT_PRESET_BY_PERIODO[selectedPeriodoRef.current] ?? 'dusk',
              },
            },
          }
        : undefined
    map.setStyle(def.style, styleOptions)
    map.once('style.load', async () => {
      const store = getStoreState()
      try {
        await addAllSourcesAndLayers(map, store.activeFilters, selectedPeriodoRef.current)
      } catch (err) {
        console.warn('Could not reload map layers after style change:', err)
        return
      }
      applyDataLayerTheme(map, styleMode === 'dusk3d' ? 'dusk' : 'light')
      updateLayerVisibility(map, store.activeFilters)
      updateIaHighlight(map, store.highlightedClusters)
      const cardOnly = store.openZones
        .map((zone) => zone.code)
        .filter((code) => !store.highlightedClusters.includes(code))
      updateCardHighlight(map, cardOnly)
    })
    map.easeTo(def.camera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleMode, loaded])

  // 3D lighting follows the analyzed period (madrugada -> night, etc.).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded || styleMode !== 'dusk3d') return
    try {
      map.setConfigProperty('basemap', 'lightPreset', LIGHT_PRESET_BY_PERIODO[selectedPeriodo] ?? 'dusk')
    } catch (err) {
      console.warn('Could not update basemap light preset:', err)
    }
  }, [selectedPeriodo, styleMode, loaded])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    updateIaHighlight(mapRef.current, highlightedClusters)
    // Card-only zones ring purple; zones already in the chat context ring blue.
    const cardOnly = openZones
      .map((zone) => zone.code)
      .filter((code) => !highlightedClusters.includes(code))
    updateCardHighlight(mapRef.current, cardOnly)
  }, [highlightedClusters, openZones, loaded])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const map = mapRef.current
    getConcentracao(selectedPeriodo)
      .then((geojson) => {
        if (map.getSource('concentracion-heatmap')) {
          map.getSource('concentracion-heatmap').setData(geojson)
        }
      })
      .catch((err) => {
        console.warn('Could not refresh concentracao data:', err)
      })
  }, [selectedPeriodo, loaded])

  return (
    <div className="absolute inset-0 h-full w-full">
      {!useMapbox ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-purple-50 p-6 text-center">
          <span className="text-4xl">🗺️</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-800">Vista de mapa desactivada</h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Mapbox está apagado en este entorno para evitar consumo de API. Para habilitarlo, configurá <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono">VITE_USE_MAPBOX=true</code> junto con tu token local.
          </p>
        </div>
      ) : tokenError ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-6 text-center">
          <span className="text-4xl">🔑</span>
          <h3 className="mt-4 text-lg font-semibold text-red-600">Clave de Mapbox inválida o ausente</h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Configurá la variable <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono">VITE_API_KEY_MAPBOX</code> en tu archivo <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono">frontend/.env</code> y reiniciá el servidor de desarrollo.
          </p>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="h-full w-full" />
          {loaded && !mapError ? (
            <div className="absolute bottom-2.5 right-12 z-10 flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
              <button
                type="button"
                onClick={() => setStyleMode('light')}
                title="Mapa claro 2D"
                aria-pressed={styleMode === 'light'}
                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  styleMode === 'light' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={styleMode === 'light' ? { backgroundColor: 'var(--bit-purple-deep)' } : undefined}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => setStyleMode('dusk3d')}
                title="Vista 3D atardecer"
                aria-pressed={styleMode === 'dusk3d'}
                className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  styleMode === 'dusk3d' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={styleMode === 'dusk3d' ? { backgroundColor: 'var(--bit-purple-deep)' } : undefined}
              >
                3D
              </button>
            </div>
          ) : null}
          {mapError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
              <span className="text-4xl">⚠️</span>
              <h3 className="mt-4 text-lg font-semibold text-red-600">No se pudo cargar el mapa</h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                {mapError}
              </p>
            </div>
          ) : !loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
              <p className="mt-4 text-sm text-gray-500">Cargando mapa...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
