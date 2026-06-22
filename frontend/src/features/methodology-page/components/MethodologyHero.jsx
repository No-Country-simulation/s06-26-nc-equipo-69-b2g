export default function MethodologyHero() {
  return (
    <section
      className="px-6 md:px-10 py-12 md:py-16"
      style={{ background: 'var(--bit-purple-deep, #2C2750)' }}
    >
      <div className="max-w-4xl mx-auto">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Public Sans', sans-serif" }}
        >
          Panel de Datos Públicos
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em' }}
        >
          Metodología
        </h1>
        <p
          className="text-base md:text-lg max-w-2xl leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Public Sans', sans-serif" }}
        >
          Cómo procesamos los datos CDRView para construir indicadores de movilidad,
          cobertura y concentración poblacional en el territorio de referencia.
        </p>
      </div>
    </section>
  )
}
