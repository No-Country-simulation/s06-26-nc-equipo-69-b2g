import { BarChart3, BookOpen, Download, Map, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const navLinks = [
  { label: 'Mapa',        key: 'mapa',        icon: Map,      href: '/mapa' },
  { label: 'Comparar',    key: 'comparar',    icon: BarChart3, href: '/comparar' },
  { label: 'Metodología', key: 'metodologia', icon: BookOpen,  href: '/metodologia' },
]

export default function Navbar({ activePage = 'mapa', onNavigate }) {
  const navigate = useNavigate()
  
  const handleClick = (href, key) => {
    if (onNavigate) {
      onNavigate(key)
    } else {
      navigate(href)
    }
  }

  return (
    <nav
      className="flex h-14 shrink-0 items-center justify-between px-3 md:h-12 md:px-4"
      style={{ backgroundColor: 'var(--bit-purple-deep, #2C2750)' }}
    >
      {/* Left: Logo + Nav */}
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            BiT
          </div>
          <span className="truncate text-sm font-semibold text-white/90 md:max-w-none"
            style={{ fontFamily: "'Public Sans', sans-serif" }}>
            Panel de Datos Públicos
          </span>
        </div>

        {/* Nav Links – desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = activePage === link.key
            return (
              <button
                key={link.key}
                onClick={() => handleClick(link.href, link.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white/80'
                }`}
                style={isActive ? { backgroundColor: 'rgba(255,255,255,0.15)' } : {}}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Export + Avatar – desktop */}
      <div className="hidden items-center gap-3 md:flex">
        <button className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20">
          <Download className="h-3.5 w-3.5" />
          Exportar reporte
        </button>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
        >
          <span className="text-white">GP</span>
        </div>
      </div>

      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
            aria-label="Abrir navegación"
          >
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[min(86vw,320px)] gap-0 border-l border-gray-200 bg-white p-0 text-gray-900 shadow-2xl md:hidden"
        >
          <div className="border-b border-gray-100 px-5 py-4 pr-14">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: '#2C2750' }}
              >
                BiT
              </div>
              <SheetTitle className="text-sm font-semibold text-gray-900">
                Panel de Datos Públicos
              </SheetTitle>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-3 py-4">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = activePage === link.key
                return (
                  <SheetClose key={link.key} asChild>
                    <button
                      type="button"
                      onClick={() => handleClick(link.href, link.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-purple-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      style={isActive ? { backgroundColor: 'color-mix(in srgb, #564C8E 8%, #FFFFFF)' } : {}}
                    >
                      <link.icon className="h-4 w-4" style={isActive ? { color: '#564C8E' } : {}} />
                      {link.label}
                    </button>
                  </SheetClose>
                )
              })}
            </div>

            <div className="mt-auto border-t border-gray-100 pt-4">
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#2C2750' }}
                >
                  <Download className="h-4 w-4" />
                  Exportar reporte
                </button>
              </SheetClose>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(86,76,142,0.2)' }}
                >
                  <span style={{ color: '#564C8E' }}>GP</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">GP</p>
                  <p className="text-xs text-gray-500">Usuario activo</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}