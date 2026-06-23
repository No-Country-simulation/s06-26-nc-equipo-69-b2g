import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const token = import.meta.env.VITE_API_KEY_MAPBOX

export default function MapboxMap() {
  const mapContainer = useRef(null)
  const [tokenError, setTokenError] = useState(!token)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (tokenError || !mapContainer.current) return

    try {
      mapboxgl.accessToken = token
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-48.55, -27.59],
        zoom: 11,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

      map.on('load', () => {
        setLoaded(true)
      })

      map.on('error', (e) => {
        if (e.error && (e.error.status === 401 || e.error.message?.includes('401'))) {
          setTokenError(true)
        }
      })

      return () => {
        map.remove()
      }
    } catch (err) {
      console.error("Error al inicializar Mapbox:", err)
      setTimeout(() => setTokenError(true), 0)
    }
  }, [tokenError])

  return (
    <div className="relative h-full w-full flex-1">
      {tokenError ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 p-6 text-center">
          <span className="text-4xl">🔑</span>
          <h3 className="mt-4 text-lg font-semibold text-red-600">Clave de Mapbox inválida o ausente</h3>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Configurá la variable <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono">VITE_API_KEY_MAPBOX</code> en tu archivo <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-mono">frontend/.env</code> y reiniciá el servidor de desarrollo.
          </p>
        </div>
      ) : !loaded ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          <p className="mt-4 text-sm text-gray-500">Cargando mapa...</p>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="h-full w-full" />
        </>
      )}
    </div>
  )
}
