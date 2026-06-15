import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'

mapboxgl.accessToken = import.meta.env.VITE_API_KEY_MAPBOX

export default function MapboxMap() {
  const mapContainer = useRef(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      map.remove()
    }
  }, [])

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
          <Button variant="default" size="sm" onClick={() => window.location.reload()}>
            Recargar mapa
          </Button>
        </div>
        <div ref={mapContainer} className="h-[520px] w-full overflow-hidden rounded-3xl border border-border bg-slate-950" />
      </div>
    </div>
  )
}
