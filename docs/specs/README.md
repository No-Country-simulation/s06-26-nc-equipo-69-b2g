# docs-spec — Especificaciones

Cada archivo acá es una feature diseñada para que otra IA (o dev) la ejecute sin
redescubrir el contexto. Antes de retomar una, leé el archivo completo y verificá
que el estado del código sigue siendo el que describe la sección "Estado actual".

| Spec | Feature | Estado |
|------|---------|--------|
| [per-user-model-persistence.md](./per-user-model-persistence.md) | Que el modelo de IA elegido persista por usuario (cross-device) | Implementada (2026-07-06) |
| [conversation-memory.md](./conversation-memory.md) | Memoria de conversación por usuario (tabla vectorial) para personalizar respuestas | Implementada (2026-07-06) |

Notas de implementación (2026-07-06):
- Embeddings en uso: `vector(2048)` (nemotron). `conversation_memory` NO lleva
  índice ANN: pgvector ivfflat/hnsw soportan máx 2000 dims; la RPC
  `match_conversation_memory` escanea solo las filas del usuario.
- Whitelist de modelos refrescada contra el catálogo vivo de OpenRouter:
  `google/gemini-2.0-flash-001` y `anthropic/claude-3.5-haiku` ya no existen;
  se reemplazaron por `google/gemini-2.5-flash-lite` y `anthropic/claude-haiku-4.5`.
- `DELETE /api/v1/memory` (requireAuth) borra el historial del usuario.

## Contexto compartido (leer una vez)

- **Monorepo, dos worktrees / dos ramas:** backend en rama `dev/backend`
  (`.../s06-26-nc-equipo-69-b2g-backend`), frontend en `dev/frontend`
  (`.../s06-26-nc-equipo-69-b2g`). Se pushea directo a esas ramas (sin PR).
- **Backend:** Express (JS, ESM), estructura por módulos en `backend/src/modules/*`,
  router raíz en `backend/src/routes/index.js` montado bajo `/api/v1`.
- **Auth:** `requireAuth` (`backend/src/middlewares/requireAuth.js`) valida el JWT
  propio del backend y setea `req.user = { id, email, firstName, lastName }`.
  `req.user.id` = id de usuario de Supabase Auth (uuid).
- **DB:** Supabase (Postgres) con RLS activa. Para escribir/leer tablas con RLS sin
  policy anon se usa el cliente service-role (ver patrón en
  `backend/src/modules/auth/auth.service.js`: `supabaseAdmin`).
- **IA:** `backend/src/ai/openrouter.service.js` (`callOpenRouter`), embeddings en
  `backend/src/ai/embeddings.service.js` (`embedText` → OpenRouter, devuelve vector o
  `null`). El endpoint de chat es `POST /api/v1/datos`
  (`backend/src/modules/query/query.controller.js`), **hoy público (sin auth)**.
- **Modelo dinámico (ya implementado):** whitelist + selección en
  `backend/src/ai/model.registry.js`, endpoints `GET/POST /api/v1/models`
  (`backend/src/modules/models/`). Hoy la selección es **global e in-memory**.
