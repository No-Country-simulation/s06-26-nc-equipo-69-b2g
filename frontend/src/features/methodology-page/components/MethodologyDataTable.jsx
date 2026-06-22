const sources = [
  { name: 'CDRView', version: 'jun/2026', description: 'Registros de llamadas y datos de red 4G/5G', frequency: 'Mensual', coverage: 'Florianópolis, SC' },
  { name: 'IBGE Censo', version: '2022', description: 'Datos demográficos y densidad poblacional', frequency: 'Decenal', coverage: 'Brasil' },
  { name: 'ANATEL ERGB', version: '2025-Q4', description: 'Ubicación y parámetros de antenas ERB', frequency: 'Trimestral', coverage: 'Brasil' },
  { name: 'OpenStreetMap', version: 'live', description: 'Geometría vial y límites de barrios', frequency: 'Continuo', coverage: 'Global' },
]

export default function MethodologyDataTable() {
  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'var(--bit-border, #E2E4DF)' }}
    >
      <table className="w-full text-sm" style={{ fontFamily: "'Public Sans', sans-serif", borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bit-elev, #F5F6F4)', borderBottom: '1px solid var(--bit-border-strong, #C7CBC4)' }}>
            {['Fuente', 'Versión', 'Descripción', 'Frecuencia', 'Cobertura'].map(h => (
              <th
                key={h}
                className="text-left px-3 py-2.5"
                style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--bit-text-2, #5B6269)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sources.map((s, i) => (
            <tr
              key={s.name}
              style={{ borderBottom: i < sources.length - 1 ? '1px solid var(--bit-border, #E2E4DF)' : 'none' }}
            >
              <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--bit-purple, #564C8E)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
                {s.name}
              </td>
              <td className="px-3 py-2.5" style={{ color: 'var(--bit-text-2, #5B6269)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
                {s.version}
              </td>
              <td className="px-3 py-2.5" style={{ color: 'var(--bit-text, #21262B)' }}>
                {s.description}
              </td>
              <td className="px-3 py-2.5" style={{ color: 'var(--bit-text-2, #5B6269)' }}>
                {s.frequency}
              </td>
              <td className="px-3 py-2.5" style={{ color: 'var(--bit-text-2, #5B6269)' }}>
                {s.coverage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
