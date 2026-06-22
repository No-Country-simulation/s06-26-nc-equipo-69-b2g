import { BarChart3, BookOpen, Download, Map, Menu } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const navLinks = [
  { label: 'Mapa', icon: Map, active: true },
  { label: 'Comparar', icon: BarChart3, active: false },
  { label: 'Metodología', icon: BookOpen, active: false },
]

export default function Navbar() {
  return (
    <nav className="flex h-14 shrink-0 items-center justify-between px-3 md:h-12 md:px-4"
         style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
      {/* Left: Logo + Nav */}
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-[10px] font-bold text-white">
            BiT
          </div>
          <span className="truncate text-sm font-semibold text-white/90 md:max-w-none">
            Panel de Datos Públicos
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
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
      <div className="hidden items-center gap-3 md:flex">
        <button className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20">
          <Download className="h-3.5 w-3.5" />
          Exportar reporte
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
             style={{ backgroundColor: 'var(--bit-purple-light)' }}>
          <span className="text-white">GP</span>
        </div>
      </div>

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
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-[10px] font-bold text-white"
                   style={{ backgroundColor: 'var(--bit-purple-deep)' }}>
                BiT
              </div>
              <SheetTitle className="text-sm font-semibold text-gray-900">
                Panel de Datos Públicos
              </SheetTitle>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-3 py-4">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <SheetClose key={link.label} asChild>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-purple-50 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </button>
                </SheetClose>
              ))}
            </div>

            <div className="mt-auto border-t border-gray-100 pt-4">
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--bit-purple-deep)' }}
                >
                  <Download className="h-4 w-4" />
                  Exportar reporte
                </button>
              </SheetClose>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                     style={{ backgroundColor: 'var(--bit-purple-light)' }}>
                  <span className="text-white">GP</span>
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
