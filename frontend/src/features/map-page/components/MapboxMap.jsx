import { useEffect, useRef, useState } from 'react'
import { addAllSourcesAndLayers, addClusterClickHandler, ensureCorredoresLoaded, updateLayerVisibility } from '../lib/mapLayers'
import useMapPageStore from '../store/useMapPageStore'

const token = import.meta.env.VITE_API_KEY_MAPBOX
const useMapbox = import.meta.env.VITE_USE_MAPBOX === 'true'

export default function MapboxMap({ selectedPeriodo }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const activeFilters = useMapPageStore((s) => s.activeFilters)
  const demografiaData = useMapPageStore((s) => s.demografiaData)
  const clusterProperties = useMapPageStore((s) => s.clusterProperties)
  const setDemografiaData = useMapPageStore((s) => s.setDemografiaData)
  const setClusterProperties = useMapPageStore((s) => s.setClusterProperties)
  const getStoreState = useMapPageStore.getState
  const [tokenError, setTokenError] = useState(useMapbox && !token)
  const [mapError, setMapError] = useState(null)
  const [loaded, setLoaded] = useState(false)

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
        map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-48.55, -27.59],
          zoom: 11,
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
          setLoaded(true)
          requestMapResize()
          await addAllSourcesAndLayers(map, activeFilters, selectedPeriodo)
          addClusterClickHandler(map, getStoreState)

          const apiUrl = import.meta.env.VITE_API_URL || ''

          if (!demografiaData) {
            try {
              const demoRes = await fetch(`${apiUrl}/api/v1/mapa/demografia`)
              const demoJson = await demoRes.json()
              setDemografiaData(demoJson)
            } catch {
              // demografia not available
            }
          }

          if (!clusterProperties) {
            try {
              const clustersRes = await fetch(`${apiUrl}/api/v1/mapa/clusters`)
              const clustersJson = await clustersRes.json()
              const propsMap = {}
              clustersJson.features.forEach((f) => {
                const name = f.properties?.cluster
                if (name) propsMap[name] = f.properties
              })
              setClusterProperties(propsMap)
            } catch {
              // clusters properties not available
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
        map.remove()
      }
    }
  }, [tokenError])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    updateVisibility(mapRef.current)
    ensureCorredoresLoaded(mapRef.current, activeFilters)
  }, [activeFilters, loaded])

  useEffect(() => {
    if (!mapRef.current || !loaded) return
    const map = mapRef.current
    const apiUrl = import.meta.env.VITE_API_URL || ''
    fetch(`${apiUrl}/api/v1/mapa/concentracao?periodo=${selectedPeriodo}`)
      .then((r) => r.json())
      .then((geojson) => {
        if (map.getSource('concentracion-heatmap')) {
          map.getSource('concentracion-heatmap').setData(geojson)
        }
      })
      .catch(() => {})
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
