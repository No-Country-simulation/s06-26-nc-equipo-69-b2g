# Panel de Datos Públicos — App BiT (B2G)

**Equipo 69**

Este repositorio contiene el código fuente y la documentación para la plataforma **BiT (Business to Government)**. Una herramienta de decisión impulsada por IA para gestores públicos que cruza datos geográficos de conectividad con indicadores sociales públicos.

## Stack Tecnológico

- **Frontend**: React + Tailwind CSS
- **Backend & Base de Datos**: JavaScript (Node.js) + Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces + Turborepo

## Estructura del Proyecto

- `/docs`: Contiene toda la documentación del proyecto (MVP, Casos de Uso, Base de Datos y Roadmap para Trello).
- `/frontend`: Código fuente de la Web App Responsiva (PWA).
- `/backend`: Código fuente de la API y el procesamiento de los datos.

## Desarrollo

Usar siempre **pnpm** desde la raiz del repo.

```bash
pnpm install
pnpm dev
```

Comandos de desarrollo desde la raiz:

```bash
pnpm dev:frontend
pnpm dev:backend
pnpm dev:local
```

Migraciones de Supabase/PostgreSQL desde la raiz:

```bash
pnpm db:migration:new <nombre>
pnpm db:migrate:status
pnpm db:migrate
pnpm db:pull
pnpm db:reset
```

Para usar comandos contra un proyecto remoto, primero autenticar y vincular localmente con Supabase CLI. No commitear tokens, `.env` ni `project_ref`.

Validaciones principales:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

## Documentación Clave

- [Definición del MVP](./docs/MVP_Definicion.md)
- [Casos de Uso](./docs/Casos_de_Uso.md)
- [Contexto del Dataset](./docs/Dataset_Contexto.md)
- [System Prompt de IA](./docs/Prompt_IA.md)
- [Workflow del proyecto](./docs/workflow.md)
- [Deploy](./docs/deploy.md)
- [MCP local seguro](./docs/mcp.md)

---

_Hackathon No-Country - Desafío B2G_
