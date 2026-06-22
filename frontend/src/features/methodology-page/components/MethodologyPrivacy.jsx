const items = [
  {
    icon: '🔒',
    title: 'Privacidad por diseño',
    text: 'Ningún dato individual es almacenado ni visualizado. Todo el pipeline opera sobre agregados espaciales irreversibles.',
  },
  {
    icon: '⚖️',
    title: 'Marco legal',
    text: 'Cumplimos con la LGPD (Lei Geral de Proteção de Dados) y los términos del acuerdo de uso de datos de la Anatel.',
  },
  {
    icon: '📉',
    title: 'Limitaciones conocidas',
    text: 'Los datos representan únicamente usuarios de telefonía móvil. Poblaciones sin celular (aprox. 4% en Florianópolis) no están representadas.',
  },
  {
    icon: '🔄',
    title: 'Actualización',
    text: 'Los indicadores se recalculan mensualmente. El panel muestra siempre la última versión disponible con fecha de corte visible.',
  },
]

export default function MethodologyPrivacy() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(item => (
        <div
          key={item.title}
          className="p-4 rounded-lg border"
          style={{
            background: 'var(--bit-surface, #FFFFFF)',
            borderColor: 'var(--bit-border, #E2E4DF)',
            boxShadow: 'var(--bit-shadow-sm, 0 1px 2px rgba(20,30,35,0.07))',
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-none">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--bit-text, #21262B)', fontFamily: "'Public Sans', sans-serif" }}>
                {item.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--bit-text-2, #5B6269)', fontFamily: "'Public Sans', sans-serif" }}>
                {item.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
