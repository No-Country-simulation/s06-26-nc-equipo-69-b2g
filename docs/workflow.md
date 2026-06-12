# Workflow del proyecto

Este repo se trabaja como monorepo administrado desde la raiz con pnpm y Turborepo.

## Camino rapido

1. Instalar Node 22 y pnpm 10.
2. Ejecutar `pnpm install` desde la raiz.
3. Desarrollar con `pnpm dev:local`, `pnpm dev:frontend` o `pnpm dev:backend`.
4. Validar con `pnpm check`, `pnpm lint`, `pnpm test` y `pnpm build`.

## Reglas

| Tema          | Decision                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| Paquetes      | Usar siempre `pnpm`. No usar `npm`, `npx` ni `yarn`.                                   |
| Lockfile      | Unico lockfile en raiz: `pnpm-lock.yaml`.                                              |
| Workspaces    | `backend` y `frontend` se instalan desde la raiz.                                      |
| Base de datos | Usar Supabase CLI desde la raiz para migraciones PostgreSQL.                           |
| Branches      | Usar `<type>/<issue-id>-descripcion-corta`, ej. `feat/42-agregar-login`.               |
| Issues/PRs    | Usar `type(scope): descripcion corta`.                                                 |
| Labels        | Todo issue requiere un `type:*`, un `status:*`, un `priority:*`; `area:*` es opcional. |
| PRs           | Todo PR debe cerrar un issue aprobado con `Closes #ID`.                                |
| Secretos      | No commitear `.env`, tokens, `project_ref` ni `mcp.json` local.                        |

## Scripts raiz

| Comando             | Uso                                         |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Levanta tareas de desarrollo con Turbo.     |
| `pnpm dev:frontend` | Levanta solo el workspace `frontend`.       |
| `pnpm dev:backend`  | Levanta solo el workspace `backend`.        |
| `pnpm dev:local`    | Levanta `frontend` y `backend` en paralelo. |
| `pnpm build`        | Ejecuta builds de paquetes.                 |
| `pnpm check`        | Ejecuta checks definidos por paquete.       |
| `pnpm lint`         | Ejecuta lint.                               |
| `pnpm test`         | Ejecuta tests disponibles.                  |
| `pnpm format`       | Verifica formato con Prettier.              |

## Base de datos

Ejecutar estos comandos desde la raiz para que Supabase use `supabase/` como directorio del proyecto local.

| Comando                          | Uso                                            |
| -------------------------------- | ---------------------------------------------- |
| `pnpm db:migration:new <nombre>` | Crea una migracion en `supabase/migrations`.   |
| `pnpm db:migrate:status`         | Lista migraciones locales y remotas.           |
| `pnpm db:migrate`                | Aplica migraciones al proyecto vinculado.      |
| `pnpm db:pull`                   | Trae cambios remotos como migracion local.     |
| `pnpm db:reset`                  | Reinicia la base local y reaplica migraciones. |

Antes de operar contra Supabase remoto, autenticar y vincular el proyecto de forma local con Supabase CLI. No commitear tokens, `.env`, `project_ref` ni archivos generados con datos sensibles.
