import { useEffect, useRef } from "react";

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l8 8M14 6l-8 8" />
    </svg>
  );
}

function Overlay({ onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
    />
  );
}

function ModalShell({ onClose, wide, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <Overlay onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          className={`relative pointer-events-auto w-full rounded-2xl bg-white shadow-[0_20px_60px_rgba(20,30,35,0.18),0_4px_16px_rgba(20,30,35,0.10)] animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden ${wide ? "max-w-[580px]" : "max-w-[480px]"}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#8A9197] hover:bg-[#F3F2F7] hover:text-[#21262B] transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
          {children}
        </div>
      </div>
    </>
  );
}

/* ── Fuentes de Datos ── */
const FUENTES = [
  {
    emoji: "📡",
    name: "Vísent CDRView",
    desc: "Datos de conectividad, movilidad OD y concentración de personas.",
    color: "#564C8E",
  },
  {
    emoji: "📶",
    name: "Anatel",
    desc: "Calidad de red, estaciones base y tecnología desplegada.",
    color: "#2E7D6F",
  },
  {
    emoji: "🏛️",
    name: "IBGE",
    desc: "Censo demográfico, nivel socioeconómico y datos territoriales.",
    color: "#8B5E3C",
  },
];

export function FuentesPopup({ onClose }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="px-7 pt-7 pb-6">
        <h2 className="text-[19px] font-bold text-[#21262B] mb-1">Fuentes de Datos</h2>
        <p className="text-[13px] text-[#8A9197] mb-5">Información que alimenta el análisis territorial</p>

        <div className="flex flex-col gap-3">
          {FUENTES.map((f) => (
            <div
              key={f.name}
              className="flex items-start gap-4 rounded-xl border border-[#E2E4DF] bg-[#FAFBFA] px-5 py-4"
            >
              <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full text-[20px]" style={{ background: `${f.color}12` }}>
                {f.emoji}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-bold text-[#21262B]">{f.name}</span>
                <span className="text-[13px] leading-relaxed text-[#5B6269]">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

/* ── Ejemplos de Consultas ── */
const EJEMPLOS = [
  "¿Qué distritos tienen alta densidad poblacional pero baja cobertura 4G?",
  "¿Dónde hay mucha gente y mala calidad de red?",
  "¿Qué regiones tienen bajo empleo formal y alta concentración de personas?",
];

export function EjemplosPopup({ onClose, onProbarAhora }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="px-7 pt-7 pb-6">
        <h2 className="text-[19px] font-bold text-[#21262B] mb-1">Ejemplos de Consultas</h2>
        <p className="text-[13px] text-[#8A9197] mb-5">Preguntas que podés hacerle al mapa inteligente</p>

        <div className="flex flex-col gap-2.5 mb-5">
          {EJEMPLOS.map((ej, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-xl border border-[#E2E4DF] bg-[#FAFBFA] px-5 py-3.5"
            >
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#564C8E] text-[12px] font-bold text-white mt-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {i + 1}
              </span>
              <span className="text-[13.5px] leading-relaxed text-[#21262B]">{ej}</span>
            </div>
          ))}
        </div>

        <p className="text-[12.5px] text-[#8A9197] mb-4 italic">
          Podés escribir tus propias preguntas en la barra de búsqueda del mapa inteligente.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onProbarAhora}
            className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#564C8E] px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#6259A0] transition-colors cursor-pointer"
          >
            Probar ahora <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── BiT AI Respuesta ── */
export function BitAiPopup({ onClose, onVerEnMapa }) {
  return (
    <ModalShell onClose={onClose} wide>
      <div className="px-7 pt-7 pb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2C2750] text-[11px] font-semibold text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>BiT</span>
          <h2 className="text-[19px] font-bold text-[#21262B]">AI — Respuesta de Análisis</h2>
        </div>
        <p className="text-[13px] text-[#8A9197] mb-5 ml-[42px]">Ejemplo de análisis generado por el asistente</p>

        <div className="rounded-xl border border-[#E2E4DF] bg-[#FAFBFA] overflow-hidden">
          {/* Consulta */}
          <div className="border-b border-[#E2E4DF] px-6 py-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9197]">Consulta</span>
            <p className="text-[14px] font-semibold text-[#21262B] mt-0.5">"¿Cuál es el estado de la región de Kobrasol?"</p>
          </div>

          <div className="border-b border-[#E2E4DF] px-6 py-5 flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9197]">Riesgo de Exclusión</span>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3.5 py-1.5 w-fit">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[13px] font-bold text-red-700">Alto</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9197]">Hallazgo Clave</span>
            <p className="text-[13px] leading-relaxed text-[#21262B] mt-1.5">
              Se detectó un flujo de movilidad de <strong>25k personas/día</strong> en horas pico con una calidad de red 4G por debajo del <strong>40%</strong> de estabilidad.
            </p>
          </div>

          {/* Recomendación */}
          <div className="px-6 py-4 border-b border-[#E2E4DF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9197]">Recomendación</span>
            <p className="text-[13px] leading-relaxed text-[#21262B] mt-1.5">
              Priorizar inversión en infraestructura: Despliegue de micro-celdas en el eje comercial central para mitigar congestión.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-white/60">
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-[#8A9197]">
                Fuentes: <strong className="text-[#5B6269]">Vísent CDRView, Anatel</strong>
              </span>
              <span className="text-[11px] text-[#8A9197]">·</span>
              <span className="text-[11.5px] text-[#8A9197]">Actualizado: hace 2hs</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          <button className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#C7CBC4] bg-white/90 px-4 py-2 text-[13px] font-semibold text-[#564C8E] hover:border-[#564C8E] hover:bg-[#F3F2F7] transition-colors cursor-pointer">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2.5h7l3 3v12H5v-15Z" />
              <path d="M7.5 9h5M7.5 12h3" />
            </svg>
            Descargar PDF
          </button>
          <button
            onClick={onVerEnMapa}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-transparent bg-[#564C8E] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#6259A0] transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5.5 8 3.5l4 2 5-2v11l-5 2-4-2-5 2v-11Z" />
              <path d="M8 3.5v11M12 5.5v11" />
            </svg>
            Ver en Mapa
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
