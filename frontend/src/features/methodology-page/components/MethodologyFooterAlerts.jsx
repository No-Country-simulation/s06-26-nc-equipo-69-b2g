import { Lock, AlertTriangle } from 'lucide-react'

export default function MethodologyFooterAlerts() {
  return (
    <div className="flex flex-col gap-2">
      {/* Privacy alert */}
      <div
        className="flex items-center gap-2.5 rounded-lg px-4 py-3"
        style={{
          background: 'var(--elev)',
          border: '1px solid var(--border)',
        }}
      >
        <Lock size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
          <strong style={{ color: 'var(--text)' }}>Privacidad.</strong>{' '}
          Datos sintéticos, agregados y anonimizados. No se expone información individual.
        </p>
      </div>

      {/* Decision support alert */}
      <div
        className="flex items-center gap-2.5 rounded-lg px-4 py-3"
        style={{
          background: 'var(--risk-med-bg)',
          border: '1px solid var(--risk-med-bd)',
        }}
      >
        <AlertTriangle size={13} style={{ color: 'var(--risk-med-text)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-ui)' }}>
          <strong style={{ color: 'var(--text)' }}>Apoyo a la decisión, no decisión automática.</strong>{' '}
          Esta plataforma y la IA ofrecen información como apoyo al análisis; la decisión final corresponde siempre al gestor público.
        </p>
      </div>
    </div>
  )
}