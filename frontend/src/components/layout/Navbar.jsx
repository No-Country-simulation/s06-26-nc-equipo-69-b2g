import { Map, BarChart3, BookOpen, Download, User } from 'lucide-react'

const navLinks = [
  { label: 'Mapa', icon: Map, active: true },
  { label: 'Comparar', icon: BarChart3, active: false },
  { label: 'Metodología', icon: BookOpen, active: false },
]

export default function Navbar() {
  return (
    <nav className="flex h-12 shrink-0 items-center justify-between px-4"
         style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-[10px] font-bold text-white">
            BiT
          </div>
          <span className="text-sm font-semibold text-white/90">Panel de Datos Públicos</span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                link.active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Export + Avatar */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20">
          <Download className="h-3.5 w-3.5" />
          Exportar reporte
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
             style={{ backgroundColor: 'var(--bit-purple-light)' }}>
          <span className="text-white">GP</span>
        </div>
      </div>
    </nav>
  )
}
