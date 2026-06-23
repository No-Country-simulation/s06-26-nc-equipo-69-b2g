import { Users, Wifi, ArrowLeftRight } from 'lucide-react'

const indicators = [
  {
    Icon: Users,
    name: 'Concentración de personas',
    desc: 'Personas presentes en una zona en el pico diurno. Mide presencia, no residencia.',
  },
  {
    Icon: Wifi,
    name: 'Calidad y congestión de red',
    desc: 'Conectividad estimada y nivel de congestión por antena. Estimación por modelo, no medición de campo.',
  },
  {
    Icon: ArrowLeftRight,
    name: 'Movilidad y flujos OD',
    desc: 'Desplazamientos origen-destino entre zonas durante la ventana analizada.',
  },
]

const layers = [
  'Concentración',
  'Antenas / ERBs',
  'Clusters',
  'Calidad de red / congestión',
  'Flujos OD',
  'Corredores / gargalos',
  'Riesgo calculado',
]

export default function SectionIndicadores() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-bd)' }}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>2</span>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            2. Indicadores y capas del mapa
          </p>
          <p className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
            Indicadores que componen el análisis y capas disponibles del dataset CDRView v2.
          </p>
        </div>
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {indicators.map(({ Icon, name, desc }) => (
          <div
            key={name}
            className="flex flex-col gap-2 rounded-lg p-3"
            style={{ background: 'var(--elev)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Icon size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
              {name}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
              {desc}
            </p>
          </div>
        ))}
      </div>

      {/* Layers */}
      <div>
        <p
          className="text-xs font-semibold mb-2"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)', letterSpacing: '0.07em', textTransform: 'uppercase' }}
        >
          CAPAS DEL MAPA
        </p>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <span
              key={layer}
              className="inline-flex items-center px-3 rounded-full text-xs font-medium"
              style={{
                height: 26,
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {layer}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}