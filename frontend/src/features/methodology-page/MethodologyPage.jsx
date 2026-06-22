import Navbar from './../../shared/layout/Navbar'
import MethodologyHero from './components/MethodologyHero'
import MethodologySection from './components/MethodologySection'
import MethodologyDataTable from './components/MethodologyDataTable'
import MethodologySteps from './components/MethodologySteps'
import MethodologyPrivacy from './components/MethodologyPrivacy'

/**
 * MethodologyPage
 *
 * Uso con router: pasar `onNavigate` para cambiar de página sin full reload.
 * Uso standalone: simplemente renderizar <MethodologyPage />.
 *
 * <MethodologyPage onNavigate={(key) => setPage(key)} />
 */
export default function MethodologyPage({ onNavigate }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--bit-bg, #F2F3F1)',
        fontFamily: "'Public Sans', 'Helvetica Neue', Arial, sans-serif",
        // CSS vars del Design System BiT (marca violeta)
        '--bit-purple-deep': '#2C2750',
        '--bit-purple': '#564C8E',
        '--bit-purple-hover': '#6259A0',
        '--bit-purple-tint': 'color-mix(in srgb, #564C8E 8%, #FFFFFF)',
        '--bit-bg': '#F2F3F1',
        '--bit-surface': '#FFFFFF',
        '--bit-elev': '#F5F6F4',
        '--bit-border': '#E2E4DF',
        '--bit-border-strong': '#C7CBC4',
        '--bit-text': '#21262B',
        '--bit-text-2': '#5B6269',
        '--bit-text-3': '#8A9197',
        '--bit-shadow-sm': '0 1px 2px rgba(20,30,35,0.07)',
      }}
    >
      {/* Navbar con Metodología activa */}
      <Navbar activePage="metodologia" onNavigate={onNavigate} />

      {/* Hero */}
      <MethodologyHero />

      {/* Contenido principal */}
      <main className="flex-1 py-4">

        {/* 01 · Fuentes de datos */}
        <MethodologySection number="01" title="Fuentes de datos">
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--bit-text-2, #5B6269)' }}>
            El panel integra cuatro fuentes primarias. Todos los conjuntos de datos pasan
            por validación automática de integridad antes de ingresar al pipeline.
          </p>
          <MethodologyDataTable />
        </MethodologySection>

        {/* 02 · Pipeline de procesamiento */}
        <MethodologySection number="02" title="Pipeline de procesamiento">
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--bit-text-2, #5B6269)' }}>
            El procesamiento ocurre en seis etapas secuenciales. Cada etapa es
            idempotente — si falla, se puede reiniciar desde el punto de corte sin
            riesgo de duplicados.
          </p>
          <MethodologySteps />
        </MethodologySection>

        {/* 03 · Indicadores y definiciones */}
        <MethodologySection number="03" title="Indicadores y definiciones">
          <div className="flex flex-col gap-3">
            {[
              { term: 'Cobertura de red', def: 'Porcentaje de celdas H3 con al menos una señal 4G/5G registrada en el período de análisis. Escala 0–100 %.' },
              { term: 'Índice de movilidad', def: 'Promedio ponderado de desplazamientos origen-destino normalizados por la población residente de la celda de origen (fuente: IBGE 2022).' },
              { term: 'Concentración (personas/km²)', def: 'Estimación de densidad instantánea basada en conteo de dispositivos únicos. Se aplica un factor de expansión de 1.18× para estimar la población total.' },
              { term: 'Riesgo de cuello de botella', def: 'Clasificación: Alto (flujo > P90 Y velocidad < P20), Medio (flujo > P75 Y velocidad < P40), Bajo (resto). Percentiles calculados sobre histórico de 12 meses.' },
            ].map(({ term, def }) => (
              <div
                key={term}
                className="p-4 rounded-lg border"
                style={{
                  background: 'var(--bit-surface, #FFFFFF)',
                  borderColor: 'var(--bit-border, #E2E4DF)',
                  boxShadow: 'var(--bit-shadow-sm)',
                }}
              >
                <dt
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--bit-text, #21262B)', fontFamily: "'Public Sans', sans-serif" }}
                >
                  {term}
                </dt>
                <dd
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--bit-text-2, #5B6269)', fontFamily: "'Public Sans', sans-serif" }}
                >
                  {def}
                </dd>
              </div>
            ))}
          </div>
        </MethodologySection>

        {/* 04 · Privacidad y limitaciones */}
        <MethodologySection number="04" title="Privacidad y limitaciones">
          <MethodologyPrivacy />
        </MethodologySection>

        {/* 05 · Contacto */}
        <MethodologySection number="05" title="Preguntas y transparencia">
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--bit-text-2, #5B6269)' }}>
            El código fuente del pipeline de procesamiento es auditadle por equipos
            autorizados. Para solicitar acceso al repositorio o hacer preguntas sobre
            la metodología:
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium"
            style={{
              background: 'var(--bit-surface, #FFFFFF)',
              borderColor: 'var(--bit-border-strong, #C7CBC4)',
              color: 'var(--bit-purple, #564C8E)',
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: 'var(--bit-shadow-sm)',
            }}
          >
            dados@bit.sc.gov.br
          </div>
        </MethodologySection>
      </main>

      {/* Footer */}
      <footer
        className="px-6 md:px-10 py-6 border-t text-xs"
        style={{
          borderColor: 'var(--bit-border, #E2E4DF)',
          color: 'var(--bit-text-3, #8A9197)',
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between gap-2">
          <span>BiT · Panel de Datos Públicos · Florianópolis, SC</span>
          <span>Datos: CDRView jun/2026 · LGPD-compliant</span>
        </div>
      </footer>
    </div>
  )
}