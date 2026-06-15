import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'

const token = import.meta.env.VITE_API_KEY_MAPBOX

export default function MapboxMap() {
  const mapContainer = useRef(null)
  const [tokenError, setTokenError] = useState(!token)

  useEffect(() => {
    if (tokenError || !mapContainer.current) return

    try {
      mapboxgl.accessToken = token
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-48.55, -27.59],
        zoom: 11,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      map.on('error', (e) => {
        // Capture map load unauthorized/401 errors
        if (e.error && (e.error.status === 401 || e.error.message?.includes('401'))) {
          setTokenError(true)
        }
      })

      return () => {
        map.remove()
      }
    } catch (err) {
      console.error("Error al inicializar Mapbox:", err)
      setTokenError(true)
    }
  }, [tokenError])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Mapbox</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Este componente usa Mapbox GL JS y la clave definida en <code>VITE_API_KEY_MAPBOX</code>.
            </p>
          </div>
          <Button variant="default" size="sm" onClick={() => {
            setTokenError(!import.meta.env.VITE_API_KEY_MAPBOX)
            window.location.reload()
          }}>
            Recargar mapa
          </Button>
        </div>

        {tokenError ? (
          <div className="flex h-[520px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center">
            <span className="text-4xl">🔑</span>
            <h3 className="mt-4 text-lg font-semibold text-destructive">Clave de Mapbox inválida o ausente</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Para poder cargar el mapa, asegúrate de tener configurada la variable <code>VITE_API_KEY_MAPBOX</code> con un token activo en tu archivo <code>frontend/.env</code> y de haber reiniciado tu servidor de desarrollo.
            </p>
          </div>
        ) : (
          <div ref={mapContainer} className="h-[520px] w-full overflow-hidden rounded-3xl border border-border bg-slate-950" />
        )}
      </div>
    </div>
  )
}
