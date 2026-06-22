export default function MethodologySection({ number, title, children }) {
  return (
    <section className="py-10 border-b" style={{ borderColor: 'var(--bit-border, #E2E4DF)' }}>
      <div className="max-w-4xl mx-auto px-6 md:px-10">
        <div className="flex gap-5 items-start">
          {/* Number badge */}
          <span
            className="flex-none mt-0.5 text-xs font-semibold w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--bit-purple-tint, color-mix(in srgb, #564C8E 10%, #FFFFFF))',
              color: 'var(--bit-purple, #564C8E)',
              fontFamily: "'IBM Plex Mono', monospace",
              border: '1px solid color-mix(in srgb, #564C8E 25%, #E2E4DF)',
            }}
          >
            {number}
          </span>
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-semibold mb-4"
              style={{
                color: 'var(--bit-text, #21262B)',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {title}
            </h2>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
