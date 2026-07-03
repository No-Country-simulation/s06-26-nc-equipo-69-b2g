import { useState, useMemo } from "react";
import { Sunrise, Sun, Sunset, MoonStar } from "lucide-react";

/**
 * PeriodoSwitch
 * ------------------------------------------------------------------
 * Switch de 4 estados: Madrugada / Manhã / Tarde / Noite.
 * No trae datos ni mapa — solo maneja el estado seleccionado y
 * te avisa vía onChange para que tú dispares el fetch a
 *   GET /api/v1/mapa/concentracao?periodo=<PERIODO>
 * y actualices tu mapa/detalles donde corresponda.
 *
 * Uso:
 *   <PeriodoSwitch onChange={(periodo) => cargarConcentracao(periodo)} />
 *
 * Props:
 *   value        (opcional) controla el período desde afuera
 *   defaultValue (opcional, default "MANHA") valor inicial si no usas value
 *   onChange     (opcional) recibe el id del período seleccionado
 * ------------------------------------------------------------------
 */


const PERIODOS = [
  { id: "MADRUGADA", label: "Madrugada", range: "00–06h", Icon: MoonStar },
  { id: "MANHA", label: "Manhã", range: "06–12h", Icon: Sunrise },
  { id: "TARDE", label: "Tarde", range: "12–18h", Icon: Sun },
  { id: "NOITE", label: "Noite", range: "18–24h", Icon: Sunset },
];
 
// Fallbacks alineados a la paleta "Tweaks" (por si las variables
// --brand-deep / --primary / etc. no están definidas en el :root real).
const TOKENS = {
  primary: "var(--primary, #5B4FA0)",
  primaryHover: "var(--primary-hover, #7B70C9)",
  tint: "var(--brand-tint, #ECEBF7)",
  surface: "var(--surface, #FFFFFF)",
  border: "var(--border, #DBDAD5)",
  text: "var(--text, #1C1F26)",
  text2: "var(--text-2, #55606B)",
};
 
export default function PeriodoSwitch({ value, defaultValue = "MANHA", onChange }) {
  const [internal, setInternal] = useState(defaultValue);
  const [hovered, setHovered] = useState(null);
  const periodo = value ?? internal;
  const activeIndex = useMemo(() => PERIODOS.findIndex((p) => p.id === periodo), [periodo]);
 
  const select = (id) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };
 
  return (
    <div
      role="tablist"
      aria-label="Seleccionar período del día"
      style={{
        position: "relative",
        display: "inline-flex",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: TOKENS.surface,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 8,
        padding: 2,
        gap: 1,
      }}
    >
      {/* Indicador activo deslizante */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 2,
          bottom: 2,
          left: 2,
          width: "calc((100% - 4px) / 4)",
          transform: `translateX(${activeIndex * 100}%)`,
          background: TOKENS.primary,
          borderRadius: 6,
          transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      />
 
      {PERIODOS.map((p) => {
        const isActive = p.id === periodo;
        const isHovered = hovered === p.id;
        const { Icon } = p;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={isActive}
            title={`${p.label} (${p.range})`}
            onClick={() => select(p.id)}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 26,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              background: !isActive && isHovered ? TOKENS.tint : "transparent",
              color: isActive ? TOKENS.surface : isHovered ? TOKENS.primary : TOKENS.text2,
              transition: "color 0.2s ease, background 0.2s ease",
            }}
          >
            <Icon size={14} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}