import { useState } from 'react'
import { Target, Radio, Sparkles, X } from 'lucide-react'
import useMapPageStore from '../store/useMapPageStore'

const steps = [
  {
    Icon: Target,
    title: '1 · ¿Dónde está el problema?',
    body: (
      <>
        Las <strong>burbujas</strong> son zonas con riesgo de exclusión digital:{' '}
        <span className="font-semibold text-red-600">rojo alto</span>,{' '}
        <span className="font-semibold text-yellow-600">amarillo medio</span>,{' '}
        <span className="font-semibold text-green-600">verde bajo</span>. Cuanto más grande la
        burbuja, mayor el score de riesgo. El punto negro marca zonas <strong>sin cobertura de red</strong>.
      </>
    ),
  },
  {
    Icon: Radio,
    title: '2 · ¿Dónde está la gente y qué red hay?',
    body: (
      <>
        El <strong>mapa de calor</strong> muestra la concentración de personas — cambiá la franja
        horaria con el switch de período. Activá <strong>Antenas / ERBs</strong> en Filtros y pasá
        el mouse para ver congestión y calidad de red. Los <strong>corredores</strong> muestran
        cómo se mueve la gente entre zonas.
      </>
    ),
  },
  {
    Icon: Sparkles,
    title: '3 · Cruzá los datos y decidí',
    body: (
      <>
        Mucha gente + red congestionada + zona vulnerable = <strong>prioridad de inversión</strong>.
        Hacé click en una zona para ver quiénes viven ahí (renta, edad, movilidad) y usá el
        asistente de IA para preguntar qué necesita esa zona.
      </>
    ),
  },
]

export default function MapOnboarding() {
  const isOpen = useMapPageStore((s) => s.isOnboardingOpen)
  const close = useMapPageStore((s) => s.closeOnboarding)
  const [step, setStep] = useState(0)

  if (!isOpen) return null

  const isLast = step === steps.length - 1
  const { Icon, title, body } = steps[step]

  const handleClose = () => {
    close()
    setStep(0)
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: 'var(--bit-purple-deep)' }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar guía"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
        <p className="mt-2 min-h-[5.5rem] text-sm leading-relaxed text-gray-600">{body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-purple-700' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? handleClose() : setStep(step + 1))}
              className="rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--bit-purple-deep)' }}
            >
              {isLast ? 'Explorar el mapa' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
