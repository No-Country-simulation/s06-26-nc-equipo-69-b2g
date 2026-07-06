# Spec: persistencia del modelo de IA por usuario (cross-device)

## Objetivo

Que el modelo de OpenRouter que elige cada usuario en el chat quede guardado en la
base y lo siga en cualquier navegador/dispositivo. Hoy la selección es **global e
in-memory**: la cambia un usuario y afecta a todos, y se pierde al reiniciar el
proceso (cold start de Render). Queremos que sea **por usuario y persistente**.

Decisión ya tomada por el equipo: **cross-device (persistir en DB)**, no localStorage.

## Estado actual (verificar antes de empezar)

- `backend/src/ai/model.registry.js`: whitelist `AVAILABLE_MODELS` + estado global
  `currentModel` con `getCurrentModel()` / `setCurrentModel(id)` (in-memory).
- `backend/src/ai/openrouter.service.js`: `callOpenRouter(userMessage)` usa
  `getCurrentModel()` (global).
- `backend/src/modules/models/models.controller.js`: `GET` devuelve `{ models, current }`,
  `POST` valida y llama `setCurrentModel`. **Ambos endpoints son públicos.**
- `backend/src/modules/query/query.controller.js`: `queryData` arma el `userMessage`
  y llama `callOpenRouter(userMessage)`. Endpoint `POST /api/v1/datos` **público**.
- Tabla `public.users`: columnas `id (uuid), email, first_name, last_name,
  avatar_url, created_at, updated_at`. RLS activa (sin policy anon → escribir con
  service-role).
- Frontend: `frontend/src/features/ai-chat/components/ModelSelector.jsx` (dropdown),
  `frontend/src/features/ai-chat/api/modelsService.js` (`getModels`/`setModel`),
  `frontend/src/features/ai-chat/api/datosService.js` (`askTerritorio` → POST /datos).
  El cliente HTTP (`frontend/src/shared/api/client.js`) ya adjunta el JWT si el
  usuario está logueado (`authHeaders`).

## Arquitectura elegida

El modelo deja de ser estado global del servidor y pasa a ser **atributo del
usuario / de la request**. Esto además elimina el problema de concurrencia (dos
usuarios pisándose el modelo).

Regla de resolución del modelo por consulta, en orden:
1. `model` válido (en whitelist) enviado en el body de `POST /api/v1/datos` → se usa ese.
2. Si no vino en el body pero el usuario está autenticado → `users.preferred_model`.
3. Si no hay ninguno → modelo por defecto (`env.OPENROUTER_MODEL`).

El `POST /api/v1/models` (con auth) es lo que **persiste** la preferencia; el
frontend igual manda el `model` en cada `/datos` para no depender de un read extra.

## Cambios — Backend

### 1. Migración

Agregar columna a `public.users`:

```sql
alter table public.users add column if not exists preferred_model text;
```

(Aplicar con el MCP de Supabase `apply_migration`, name sugerido
`add_preferred_model_to_users`.)

### 2. `model.registry.js`

- Mantener `AVAILABLE_MODELS`, `isModelAllowed`, `getAvailableModels`.
- Agregar `getDefaultModel()` que devuelva `env.OPENROUTER_MODEL` si está en la
  whitelist, si no `AVAILABLE_MODELS[0].id`.
- **Eliminar** el estado global `currentModel` y `getCurrentModel`/`setCurrentModel`
  (ya no hay "modelo actual" del servidor; es por usuario/request).

### 3. Nuevo `backend/src/modules/models/models.service.js`

Usar el cliente service-role (mismo patrón que `auth.service.js`, considerar
factorizar `supabaseAdmin` a `backend/src/lib/supabase.js` como export aparte para
no duplicarlo):

- `getPreferredModel(userId)` → `select preferred_model from users where id = userId`
  → devuelve el id o `null`.
- `setPreferredModel(userId, model)` → `update users set preferred_model = model,
  updated_at = now() where id = userId`. Validar antes con `isModelAllowed`.

### 4. `models.controller.js` + `models.router.js`

- `GET /api/v1/models` → **auth opcional** (ver nota abajo). Respuesta:
  `{ models: getAvailableModels(), current: <preferred del user ?? getDefaultModel()> }`.
- `POST /api/v1/models` → **`requireAuth`**. Valida `model` contra whitelist (400 si
  no), llama `setPreferredModel(req.user.id, model)`, responde `{ current }`.
- Auth opcional en el GET: crear `backend/src/middlewares/optionalAuth.js` que setee
  `req.user` si hay un Bearer token válido y **no rechace** si falta o es inválido
  (a diferencia de `requireAuth`). Reusar `verifyToken` de `auth/jwt.service.js`.

### 5. `openrouter.service.js` + `query.controller.js`

- `callOpenRouter(userMessage, model)` → recibe el modelo como parámetro; fallback a
  `getDefaultModel()` si viene vacío.
- En `queryData`: leer `req.body.model`; si está y `isModelAllowed` → usarlo. Si no,
  y hay `req.user` (ver nota), usar `getPreferredModel`. Si no, default. Pasar el
  modelo resuelto a `callOpenRouter`.
- Para tener `req.user` en `/datos` sin romper el uso anónimo, montar `optionalAuth`
  en la ruta `/datos` (que hoy es pública) — sigue funcionando sin token.

## Cambios — Frontend

- `modelsService.js`: sin cambios de firma (`getModels`/`setModel` ya pegan a los
  endpoints correctos). `setModel` ahora persiste server-side; `getModels` devuelve el
  `current` del usuario logueado.
- `ModelSelector.jsx`: ya carga `current` desde `getModels()` en el mount → con esto
  el dropdown arranca en el modelo guardado del usuario. Verificar que se remonte al
  cambiar de usuario (key por user id o refetch en login).
- `datosService.js` (`askTerritorio`): agregar `model` al body del POST /datos,
  tomándolo del estado del selector (levantar el modelo elegido a un store/prop
  compartido, p. ej. el store de `map-page` o un contexto de chat, para que el panel
  lo tenga al enviar).

## Tests

- Backend (`backend/src/test/models.routes.test.js`, ya existe — actualizarlo):
  - `POST /models` sin token → 401.
  - `POST /models` con token válido + modelo en whitelist → 200 y persiste (mockear
    `models.service`/supabase admin).
  - `POST /models` con modelo fuera de whitelist → 400.
  - `GET /models` sin token → `current === getDefaultModel()`.
  - `GET /models` con token → `current === preferred del user`.
  - Generar tokens de test con `generateToken` (`auth/jwt.service.js`); el
    `JWT_SECRET` de test está en `backend/src/test/setup.js`.
- `query.controller`: `/datos` con `model` en body usa ese modelo (mockear
  `callOpenRouter` y assert del segundo argumento).

## Gotchas

- RLS: escribir en `users` requiere service-role. Si `SUPABASE_SERVICE_ROLE_KEY` no
  está seteada, `setPreferredModel` no puede escribir → degradar con log claro (no
  romper el chat). Considerar, alternativamente, una policy RLS
  `update` que permita al usuario modificar su propia fila (`auth.uid() = id`).
- No romper el flujo anónimo: `/datos` debe seguir respondiendo sin token.
- `updated_at`: si hay trigger que lo maneja, no lo seteés a mano.
