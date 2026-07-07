import SectionDatos from './components/SectionDatos'
import SectionIndicadores from './components/SectionIndicadores'
import SectionRiesgo from './components/SectionRiesgo'
import SectionBottomRow from './components/SectionBottomRow'
import MethodologyFooterAlerts from './components/MethodologyFooterAlerts'

export default function MethodologyPage() {
  return (
    <div
      className="min-h-full"
      style={{
        '--bg':            '#F2F3F1',
        '--surface':       '#FFFFFF',
        '--elev':          '#F5F6F4',
        '--elev2':         '#EBEDE9',
        '--border':        '#E2E4DF',
        '--border-strong': '#C7CBC4',
        '--text':          '#21262B',
        '--text-2':        '#5B6269',
        '--text-3':        '#8A9197',
        '--brand-deep':    '#2C2750',
        '--primary':       '#564C8E',
        '--primary-hover': '#6259A0',
        '--on-primary':    '#FFFFFF',
        '--accent-text':   '#564C8E',
        '--brand-tint':    'color-mix(in srgb, #564C8E 7%, #FFFFFF)',
        '--brand-tint-bd': 'color-mix(in srgb, #564C8E 26%, #E2E4DF)',
        '--ai':            '#5D539B',
        '--ai-bg':         'color-mix(in srgb, #5D539B 8%, #FFFFFF)',
        '--ai-bd':         'color-mix(in srgb, #5D539B 28%, #E2E4DF)',
        '--risk-low':         '#2E8653',
        '--risk-low-text':    '#256B43',
        '--risk-low-bg':      '#E3F1E8',
        '--risk-low-bd':      '#BCDCC8',
        '--risk-med':         '#D29318',
        '--risk-med-text':    '#8A5A06',
        '--risk-med-bg':      '#FAF0DA',
        '--risk-med-bd':      '#E9D5A6',
        '--risk-high':        '#C44536',
        '--risk-high-text':   '#A93226',
        '--risk-high-bg':     '#FAE7E4',
        '--risk-high-bd':     '#EFC4BC',
        '--shadow-sm':     '0 1px 2px rgba(20,30,35,0.07)',
        '--shadow-md':     '0 3px 10px rgba(20,30,35,0.09), 0 1px 2px rgba(20,30,35,0.07)',
        '--font-ui':       '"Public Sans","Helvetica Neue",Arial,sans-serif',
        '--font-data':     '"IBM Plex Mono","SF Mono",Consolas,monospace',
        background:        '#F2F3F1',
        fontFamily:        '"Public Sans","Helvetica Neue",Arial,sans-serif',
      }}
    >
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-10 lg:px-12">
        {/* Page title */}
        <div className="mb-6">
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em' }}
          >
            Fuentes, metodología y límites del análisis
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
            Esta página explica de dónde provienen los datos, cómo interpretamos el riesgo y cómo la IA genera respuestas
            para apoyar la toma de decisiones públicas.
          </p>
        </div>

        {/* Content sections */}
        <div className="flex flex-col gap-5">
          <SectionDatos />
          <SectionIndicadores />
          <SectionRiesgo />
          <SectionBottomRow />
          <MethodologyFooterAlerts />
        </div>
      </main>
    </div>
  )
}
