import { Wifi, Radio, Users, MoreHorizontal } from 'lucide-react'

const sources = [
  {
    Icon: Wifi,
    name: 'Visent CDRView',
    desc: 'Actividad y movilidad sintéticas agregadas y anonimizadas, derivadas de señales de telefonía móvil.',
    link: 'Ver archivos del dataset →',
    color: '#156270',
  },
  {
    Icon: Radio,
    name: 'Anatel',
    desc: 'Antenas ERB licenciadas e información oficial de infraestructura de telecomunicaciones.',
    link: 'anatel.gov.br ↗',
    color: '#156270',
  },
  {
    Icon: Users,
    name: 'IBGE',
    desc: 'Censo 2022: contexto sociodemográfico y territorial de los clusters.',
    link: 'ibge.gov.br ↗',
    color: '#156270',
  },
  {
    Icon: MoreHorizontal,
    name: 'Fuentes complementarias',
    desc: 'Documentos públicos que enriquecen el contexto territorial.',
    link: 'Ver detalle de fuentes →',
    color: '#156270',
  },
]

export default function SectionDatos() {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-bd)' }}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>1</span>
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            1. Datos utilizados
          </p>
          <p className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
            Integramos datos públicos y oficiales de alta calidad.
          </p>
        </div>
      </div>

      {/* Source cards grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {sources.map(({ Icon, name, desc, link }) => (
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
            <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
              {name}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
              {desc}
            </p>
            <button
              className="text-xs font-medium text-left mt-auto"
              style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-ui)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {link}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
