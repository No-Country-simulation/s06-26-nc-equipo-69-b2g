# Guía técnica de trabajo Frontend

Esta guía define el stack, la arquitectura y las reglas de trabajo esperadas para el frontend. Está pensada para pasarse como especificación a otra IA o a una persona del equipo sin perder criterio técnico.

## Decisiones obligatorias

| Tema | Decisión |
|---|---|
| Gestor de paquetes | Usar siempre **pnpm**. No usar `npm`, `npx` ni `yarn`. |
| Lenguaje | Usar **JavaScript** con React. No usar TypeScript salvo pedido explícito. |
| Bundler | Usar **Vite**. |
| UI | React 19, CSS Modules, Tailwind CSS y `shadcn/ui` adaptado a React/Vite. |
| Dependencias | Instalar siempre las últimas versiones estables usando `@latest` cuando aplique. |

## 1. Herramientas principales

| Herramienta | Uso esperado | Link |
|---|---|---|
| OpenCode | Trabajo con agentes de IA desde terminal. | https://opencode.ai/ |
| Gentle AI | Ecosistema de agentes, skills y flujos de trabajo sobre OpenCode. | https://github.com/Gentleman-Programming/gentle-ai |
| Cursor | IDE con IA integrada. Útil para navegar, refactorizar y entender código. | https://www.cursor.com/ |
| Antigravity | IDE/agente para trabajar con IA en proyectos de software. | https://antigravity.google/ |
| Vite | Base del proyecto React: rápido, simple y liviano. | https://vite.dev/ |
| Vercel | Deploy del frontend. | https://vercel.com/ |

## 2. Stack recomendado

- **React 19** como librería principal de UI.
- **JavaScript** como lenguaje del proyecto.
- **Vite** como herramienta de desarrollo y build.
- **React Router v7** para navegación. Actualmente el paquete recomendado es `react-router`.
- **CSS Modules** para estilos, porque permite usar CSS real con scope por componente.
- **Tailwind CSS** para utilidades de layout, spacing, estados visuales rápidos y compatibilidad con `shadcn/ui`.
- **shadcn/ui** como base de componentes accesibles y personalizables, adaptada a React con Vite y JavaScript.
- **TanStack Query** si el proyecto consume APIs.
- **Zustand** solo si aparece estado global real de cliente.
- **Vercel** para deploy.

> Importante: no todo necesita una librería. Primero usar React bien; después sumar herramientas si el problema lo justifica.

## 3. Arquitectura esperada

Vamos a usar una arquitectura **feature-first** con criterio de **screaming architecture**.

Eso significa que la estructura del proyecto debe mostrar de qué trata la aplicación, no solamente qué tecnología usa.

Mal ejemplo:

```txt
src/
  components/
  hooks/
  services/
  utils/
```

Mejor ejemplo:

```txt
src/
  app/
    router/
    providers/
  features/
    auth/
      components/
      pages/
      services/
      hooks/
    dashboard/
      components/
      pages/
      services/
      hooks/
  shared/
    components/
      ui/
    hooks/
    lib/
    styles/
```

La regla principal: si algo pertenece a una funcionalidad, vive dentro de esa feature. Si algo se reutiliza entre varias features, recién ahí va a `shared`.

Los componentes generados o adaptados desde `shadcn/ui` deben vivir en `src/shared/components/ui` o en el alias equivalente configurado para el proyecto. No mezclar componentes base reutilizables con componentes específicos de una feature.

## 4. Componentes

Separar componentes por responsabilidad:

- **Pages**: pantallas conectadas al router.
- **Feature components**: componentes propios de una funcionalidad.
- **Shared components**: botones, inputs, cards o piezas reutilizables.

Evitar componentes gigantes. Si un archivo empieza a mezclar UI, lógica, datos y estilos difíciles de seguir, hay que dividirlo.

## 5. Estilos

La base de estilos combina **CSS Modules** y **Tailwind CSS**:

| Necesidad | Herramienta |
|---|---|
| Estilos propios de un componente o feature | CSS Modules |
| Layout rápido, spacing, estados visuales simples y responsive | Tailwind CSS |
| Componentes base accesibles y personalizables | `shadcn/ui` + Tailwind CSS |
| Estilos globales mínimos | `src/shared/styles` o `src/index.css` |

Ejemplo con CSS Modules:

```txt
UserCard.jsx
UserCard.module.css
```

Ejemplo:

```jsx
import styles from './UserCard.module.css';

export function UserCard() {
  return <article className={styles.card}>...</article>;
}
```

Ejemplo combinando Tailwind CSS y CSS Modules:

```jsx
import styles from './UserCard.module.css';

export function UserCard() {
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${styles.card}`}>
      ...
    </article>
  );
}
```

Regla de criterio: Tailwind no reemplaza todo el CSS. Usarlo donde mejora velocidad y consistencia. Si una clase se vuelve larga, repetitiva o difícil de entender, extraer el estilo a CSS Modules o a un componente reutilizable.

`shadcn/ui` se incorpora desde el inicio porque depende de Tailwind CSS y permite tener componentes accesibles sin inventar botones, diálogos, inputs y cards desde cero. Los componentes deben adaptarse al diseño del proyecto, no copiarse sin revisión.

## 6. Creación e instalación del proyecto

Usar siempre **pnpm** y pedir últimas versiones estables.

Crear proyecto React con Vite en JavaScript:

```bash
pnpm create vite@latest nombre-del-proyecto -- --template react
cd nombre-del-proyecto
pnpm install
```

Instalar dependencias principales cuando el proyecto las necesite:

```bash
pnpm add react-router@latest
pnpm add @tanstack/react-query@latest
pnpm add zustand@latest
```

Instalar Tailwind CSS para Vite:

```bash
pnpm add tailwindcss@latest @tailwindcss/vite@latest
```

Configurar Tailwind en `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Importar Tailwind en el CSS global:

```css
@import "tailwindcss";
```

Inicializar `shadcn/ui` con pnpm:

```bash
pnpm dlx shadcn@latest init
```

Agregar componentes con pnpm:

```bash
pnpm dlx shadcn@latest add button card dialog input label
```

Para mantener el proyecto en JavaScript, configurar `shadcn/ui` para generar componentes `.jsx` cuando el CLI lo pregunte. Si existe `components.json`, debe quedar alineado con JavaScript, por ejemplo:

```json
{
  "tsx": false,
  "tailwind": {
    "css": "src/index.css",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/components",
    "ui": "@/shared/components/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

Si el CLI genera rutas distintas, ajustarlas para respetar la arquitectura feature-first.

## 7. Estado y datos

Usar este criterio:

| Necesidad | Herramienta |
|---|---|
| Estado local de un componente | `useState`, `useReducer` |
| Compartir estado entre pocos componentes cercanos | levantar estado o usar Context |
| Estado global de cliente | Zustand |
| Datos que vienen de API | TanStack Query |

No guardar datos del servidor en Zustand salvo que exista una razón clara. Para APIs, TanStack Query suele resolver mejor caché, loading, errores y refetch.

## 8. Routing

React no trae routing completo incorporado. Para navegación de aplicación usaremos **React Router**.

Paquete recomendado:

```bash
pnpm add react-router@latest
```

Las rutas deberían vivir cerca de `src/app/router` y apuntar a páginas ubicadas dentro de cada feature.

## 9. Deploy

El deploy recomendado es **Vercel** con Vite.

Flujo esperado:

1. Subir cambios a GitHub.
2. Conectar el repo en Vercel.
3. Configurar variables de entorno si hacen falta.
4. Usar deploy automático por branch o por `main`.

## 10. Forma de trabajo con IA

La IA es una herramienta, no piloto automático.

Buenas prácticas:

- Pedirle que explique antes de generar código.
- Revisar siempre los cambios antes de aceptarlos.
- No copiar código sin entenderlo.
- Pedir refactors pequeños, no cambios enormes de golpe.
- Usar IA para aprender patrones, detectar errores y mejorar nombres.

No vamos a empezar con SDD ni TDD estricto todavía. Primero necesitamos que la base del equipo sea sólida: componentes claros, CSS ordenado, routing entendible y buen criterio para separar responsabilidades.

## 11. Checklist para otra IA

Antes de generar código, la IA debe respetar estas reglas:

- [ ] Crear el proyecto con Vite, React y JavaScript usando `pnpm create vite@latest`.
- [ ] No usar TypeScript, `.ts` ni `.tsx` salvo pedido explícito.
- [ ] No usar `npm`, `npx` ni `yarn`; convertir comandos a `pnpm` o `pnpm dlx`.
- [ ] Instalar dependencias con `@latest` cuando corresponda.
- [ ] Configurar Tailwind CSS con `@tailwindcss/vite`.
- [ ] Usar CSS Modules para estilos específicos de componentes o features.
- [ ] Usar Tailwind CSS para utilidades y compatibilidad con `shadcn/ui`.
- [ ] Ubicar componentes reutilizables en `src/shared/components`.
- [ ] Ubicar componentes base de `shadcn/ui` en `src/shared/components/ui`.
- [ ] Mantener la arquitectura feature-first: lo específico vive dentro de `src/features/<feature>`.
- [ ] Usar TanStack Query solo para datos de servidor.
- [ ] Usar Zustand solo si existe estado global real de cliente.

## 12. Links útiles

- OpenCode: https://opencode.ai/
- Gentle AI: https://github.com/Gentleman-Programming/gentle-ai
- Cursor: https://www.cursor.com/
- Antigravity: https://antigravity.google/
- React: https://react.dev/
- Vite: https://vite.dev/
- React Router: https://reactrouter.com/
- CSS Modules: https://github.com/css-modules/css-modules
- Tailwind CSS: https://tailwindcss.com/
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand-demo.pmnd.rs/
- Vercel: https://vercel.com/
- shadcn/ui: https://ui.shadcn.com/

## Criterio final

La prioridad es construir un frontend fácil de leer, mantener y explicar. Si una decisión hace el proyecto más difícil sin aportar valor real, no la usamos todavía.
