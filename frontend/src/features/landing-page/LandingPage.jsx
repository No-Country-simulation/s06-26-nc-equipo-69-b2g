import { useNavigate } from 'react-router-dom'
import Button from "./components/Button";
import Card from "./components/card";
import heroImage from "./assets/territorio-hero.jpg";

function Icon({ name, size = 18 }) {
  const c = {
    fill: "none", stroke: "currentColor",
    strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round",
  };
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  switch (name) {
    case "mapa": return (
      <svg viewBox="0 0 20 20" style={s}>
        <path {...c} d="M3 5.5 8 3.5l4 2 5-2v11l-5 2-4-2-5 2v-11Z"/>
        <path {...c} d="M8 3.5v11M12 5.5v11"/>
      </svg>
    );
    case "doc": return (
      <svg viewBox="0 0 20 20" style={s}>
        <path {...c} d="M5 2.5h7l3 3v12H5v-15Z"/>
        <path {...c} d="M7.5 9h5M7.5 12h5"/>
      </svg>
    );
    case "datos": return (
      <svg viewBox="0 0 20 20" style={s}>
        <ellipse {...c} cx="10" cy="5" rx="6" ry="2.4"/>
        <path {...c} d="M4 5v10c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V5"/>
        <path {...c} d="M4 10c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4"/>
      </svg>
    );
    case "chat": return (
      <svg viewBox="0 0 20 20" style={s}>
        <path {...c} d="M17 9.5c0 3.3-3.1 6-7 6-.9 0-1.8-.14-2.6-.4L3 16.5l1.2-3.1A5.6 5.6 0 0 1 3 9.5c0-3.3 3.1-6 7-6s7 2.7 7 6Z"/>
      </svg>
    );
    case "barras": return (
      <svg viewBox="0 0 20 20" style={s}>
        <path {...c} d="M4 16.5v-4M10 16.5v-9M16 16.5v-6"/>
      </svg>
    );
    case "escudo": return (
      <svg viewBox="0 0 20 20" style={s}>
        <path {...c} d="M10 2.5 16 5v5c0 4-2.7 6.4-6 7.5C6.7 16.4 4 14 4 10V5l6-2.5Z"/>
        <path {...c} d="m7.5 9.8 1.8 1.8 3.2-3.4"/>
      </svg>
    );
    default: return (
      <svg viewBox="0 0 20 20" style={s}>
        <circle {...c} cx="10" cy="10" r="7.5"/>
        <path {...c} d="M8 8a2 2 0 1 1 2.8 1.85c-.55.24-.8.65-.8 1.15v.3"/>
        <path stroke="none" fill="currentColor" d="M10 14.4a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z"/>
      </svg>
    );
  }
}

const ETIQUETAS = [
  { nombre: "Kobrasol",          x: 61.5, y: 22.5 },
  { nombre: "Centro Histórico", x: 76.5, y: 29   },
  { nombre: "Campeche",          x: 90.0, y: 47   },
  { nombre: "BR-101 Norte",      x: 54.5, y: 54   },
  { nombre: "Via Expressa",      x: 79.0, y: 66.5 },
];

const TARJETAS_MOB = [
  { icon: "datos",  title: "Qué datos usa",       desc: "Vísent CDRView, Anatel e IBGE"                           },
  { icon: "chat",   title: "Qué podés preguntar", desc: "Preguntas en lenguaje natural sobre el territorio"        },
  { icon: "barras", title: "Qué devuelve",         desc: "Datos, fuentes citadas y una recomendación"             },
];

const TARJETAS_DESK = [
  { icon: "datos",  title: "Qué datos usa",       desc: "Vísent CDRView (concentración, calidad de red, movilidad OD), Anatel e IBGE.", link: "Ver fuentes"  },
  { icon: "chat",   title: "Qué podés preguntar", desc: "“¿Dónde hay mucha gente y mala calidad de red?” — en lenguaje natural.",                 link: "Ver ejemplos" },
  { icon: "barras", title: "Qué devuelve",         desc: "Respuesta con datos, fuente, recomendación y cluster resaltado.",               link: "Ver ejemplo"  },
];

function MobileLayout() {
  const navigate = useNavigate()
  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-[#F2F3F1] md:hidden"
      style={{ fontFamily: "'Public Sans', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <img
        src={heroImage} alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "64% 32%" }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #F2F3F1 0%, rgba(242,243,241,0.82) 26%, rgba(242,243,241,0.40) 44%, rgba(242,243,241,0.78) 62%, #F2F3F1 80%)",
        }}
      />

      <header className="relative flex flex-none items-center gap-[9px] px-[18px] pt-2">
        <span
          className="flex h-7 w-7 flex-none items-center justify-center rounded-[7px] bg-[#2C2750] text-[11px] font-semibold text-white"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >BiT</span>
        <span className="text-[14px] font-bold text-[#21262B]">Panel de Datos Públicos</span>
        <span className="ml-auto text-[#564C8E] flex-none"><Icon name="ayuda" size={17} /></span>
      </header>

      <div className="relative flex-none px-[18px] pt-[22px]">
        <h1 className="mb-3 text-[29px] font-bold leading-[1.16] tracking-[-0.02em] text-[#21262B]">
          Decidí dónde invertir primero, con datos del territorio
        </h1>
        <p className="text-[13.5px] leading-[1.55] text-[#5B6269]" style={{ maxWidth: 320 }}>
          App BiT cruza concentración de personas, cobertura de red y movilidad para identificar
          regiones con riesgo de exclusión digital.
        </p>
      </div>

      <div className="relative flex-1" />

      <div className="relative flex-none px-[18px] flex flex-col gap-3">
        <Button variant="primary" size="lg" icon={<Icon name="mapa" />} fullWidth
          className="!h-12 !text-[14.5px]"
          onClick={() => navigate('/mapa')}>
          Abrir mapa inteligente <span aria-hidden="true">→</span>
        </Button>
        <Button variant="secondary" size="lg" icon={<Icon name="doc" />} fullWidth
          className="!h-11 !text-[14px]"
          onClick={() => navigate('/metodologia')}>
          Ver metodología
        </Button>
      </div>

      <div className="relative flex-none px-[18px] pt-4 flex flex-col gap-2">
        {TARJETAS_MOB.map((t) => (
          <Card
            key={t.title}
            icon={<Icon name={t.icon} size={16} />}
            title={t.title}
            description={t.desc}
            size="sm"
          />
        ))}
      </div>

      <footer className="relative flex-none flex items-center justify-center gap-[7px] px-[18px] py-[14px]">
        <span className="text-[#564C8E] inline-flex"><Icon name="escudo" size={13} /></span>
        <span className="text-[11.5px] font-medium text-[#5B6269]">Datos agregados y anonimizados</span>
        <span className="text-[10px] text-[#8A9197]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          · Florianópolis, SC
        </span>
      </footer>
    </div>
  );
}

function DesktopLayout() {
  const navigate = useNavigate()
  return (
    <div
      className="relative hidden min-h-screen w-full flex-col overflow-hidden bg-[#F2F3F1] md:flex"
      style={{ fontFamily: "'Public Sans', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <img
        src={heroImage} alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "68% 38%" }}
      />
      <div className="absolute inset-0" style={{
        background: "linear-gradient(92deg, #F2F3F1 0%, #F2F3F1 26%, rgba(242,243,241,0.72) 46%, rgba(242,243,241,0.18) 64%, transparent 80%)",
      }}/>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(242,243,241,0.78) 0%, transparent 18%, transparent 58%, rgba(242,243,241,0.86) 86%, #F2F3F1 100%)",
      }}/>

      {ETIQUETAS.map((e) => (
        <span
          key={e.nombre}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[12.5px] font-semibold text-[#2B3238]"
          style={{
            left: `${e.x}%`, top: `${e.y}%`,
            textShadow: "0 0 6px rgba(255,255,255,0.9), 0 1px 3px rgba(255,255,255,0.85), 0 0 14px rgba(255,255,255,0.7)",
          }}
        >{e.nombre}</span>
      ))}

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="flex items-center gap-[11px] px-12 pt-[18px]">
          <span
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-[#2C2750] text-[13px] font-semibold text-white"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >BiT</span>
          <span className="text-[15.5px] font-bold text-[#21262B]">Panel de Datos Públicos</span>
          <a className="ml-auto inline-flex cursor-pointer items-center gap-[7px] text-[13.5px] font-semibold text-[#564C8E] no-underline">
            <Icon name="ayuda" size={16} /> ¿Cómo funciona?
          </a>
        </header>

        <div className="flex flex-1 flex-col justify-center px-12" style={{ maxWidth: 660 }}>
          <h1 className="text-[46px] font-bold leading-[1.12] tracking-[-0.025em] text-[#21262B]" style={{ margin: "0 0 18px" }}>
            Decidí dónde<br/>invertir primero,<br/>con datos del territorio
          </h1>
          <p className="text-[15.5px] leading-[1.6] text-[#5B6269]" style={{ margin: "0 0 28px", maxWidth: 440 }}>
            App BiT cruza concentración de personas, cobertura de red y movilidad para identificar
            regiones con riesgo de exclusión digital — y responde tus preguntas con datos, fuentes
            y una recomendación.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="lg" icon={<Icon name="mapa" />} className="!h-[46px] !px-5 !text-[15px]"
              onClick={() => navigate('/mapa')}>
              Abrir mapa inteligente <span aria-hidden="true" style={{ fontSize: 16 }}>→</span>
            </Button>
            <Button variant="secondary" size="lg" icon={<Icon name="doc" />} className="!h-[46px] !px-5 !text-[15px]"
              onClick={() => navigate('/metodologia')}>
              Ver metodología
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3.5 px-12 py-9">
          {TARJETAS_DESK.map((t) => (
            <div
              key={t.title}
              className="flex items-start gap-3.5 rounded-[10px] border border-[#E2E4DF] px-[18px] py-4"
              style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 3px 10px rgba(20,30,35,0.09),0 1px 2px rgba(20,30,35,0.07)" }}
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#F3F2F7] text-[#564C8E]">
                <Icon name={t.icon} size={19} />
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-[#21262B]">{t.title}</span>
                <span className="text-[13px] leading-relaxed text-[#5B6269]">{t.desc}</span>
                <a className="mt-0.5 cursor-pointer text-[12.5px] font-semibold text-[#564C8E] no-underline">{t.link} ›</a>
              </div>
            </div>
          ))}
        </div>

        <footer className="flex items-center justify-center gap-2 px-12 pb-[18px]">
          <span className="text-[#564C8E] inline-flex"><Icon name="escudo" size={14} /></span>
          <span className="text-xs font-medium text-[#5B6269]">Datos agregados y anonimizados</span>
          <span className="text-[11px] text-[#8A9197]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            · Vísent CDRView · Anatel · IBGE · Florianópolis, SC
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}