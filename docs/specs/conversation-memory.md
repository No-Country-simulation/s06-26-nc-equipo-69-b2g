# Spec: memoria de conversación por usuario (personalización)

## Objetivo

Que la IA "sepa con quién está hablando": recordar las conversaciones previas de
cada usuario y usarlas como contexto para personalizar las respuestas (qué tipo de
consultas hace esa persona, zonas que le interesan, tono, etc.). Hoy cada consulta a
`POST /api/v1/datos` es **stateless**: no hay historial ni identidad ligada al chat.

Se persiste en una **tabla vectorial por usuario** y se recuperan los mensajes más
relevantes (por similitud semántica + recencia) para inyectarlos al prompt.

## Estado actual (verificar antes de empezar)

- Ya existe infra de vectores (RAG de dominio) que hay que **reusar**, no reinventar:
  - Tabla `public.documents_vectors (id, fuente, seccion, contenido, embedding vector,
    metadata jsonb, created_at)`.
  - RPC `match_documents(query_embedding, match_count)` (búsqueda por similitud).
  - `backend/src/ai/embeddings.service.js` → `embedText(text)` genera el embedding vía
    OpenRouter (modelo `EMBED_MODEL`, por defecto nemotron `:free`). Devuelve el vector
    o `null` si no hay API key / falla (degradar sin romper).
  - **Confirmá la dimensión** del vector existente (`documents_vectors.embedding`) y
    usá la MISMA para la tabla nueva, o los embeddings no van a ser comparables.
- `backend/src/modules/query/query.controller.js` → `queryData` arma `userMessage`
  (contexto + datos) y llama `callOpenRouter`. Aquí se inyecta hoy el RAG de dominio
  (`ragChunks` vía `match_documents`). El historial se inyectaría de forma análoga.
- `POST /api/v1/datos` es **público** → para memoria por usuario necesitás identidad:
  montar `optionalAuth` (ver spec de per-user-model) y sólo persistir/recuperar
  historial cuando `req.user` existe. Sin login → comportamiento actual (sin memoria).
- `req.user.id` (uuid) viene de `requireAuth`/`optionalAuth`.

## Diseño de datos

### Migración: tabla `public.conversation_memory`

```sql
create table if not exists public.conversation_memory (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  embedding   vector(<DIM>),          -- misma dimensión que documents_vectors.embedding
  metadata    jsonb default '{}'::jsonb, -- p.ej. { regions, ecgi, model }
  created_at  timestamptz not null default now()
);

create index on public.conversation_memory (user_id, created_at desc);
-- Índice ANN para similitud (ajustar lists según volumen):
create index on public.conversation_memory
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.conversation_memory enable row level security;
-- Policy: cada usuario ve/inserta sólo lo suyo (o se opera con service-role).
create policy conversation_memory_owner on public.conversation_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Reemplazar `<DIM>` por la dimensión real del embedding en uso.

### RPC de recuperación por usuario

Análoga a `match_documents` pero **filtrada por `user_id`**:

```sql
create or replace function public.match_conversation_memory(
  p_user_id uuid,
  query_embedding vector(<DIM>),
  match_count int default 5
) returns table (id bigint, role text, content text, created_at timestamptz, similarity float)
language sql stable as $$
  select cm.id, cm.role, cm.content, cm.created_at,
         1 - (cm.embedding <=> query_embedding) as similarity
  from public.conversation_memory cm
  where cm.user_id = p_user_id and cm.embedding is not null
  order by cm.embedding <=> query_embedding
  limit match_count;
$$;
```

## Cambios — Backend

### Nuevo módulo `backend/src/modules/memory/` (o dentro de `ai/`)

`memory.service.js`:
- `saveTurn(userId, role, content, metadata)`:
  - `embedText(content)` → si devuelve vector, insertar fila con embedding; si `null`,
    insertar igual sin embedding (queda como historial reciente pero no recuperable por
    similitud). Usar service-role si RLS lo requiere.
- `recallRelevant(userId, prompt, { matchCount = 5 })`:
  - `embedText(prompt)` → si hay vector, `rpc('match_conversation_memory', ...)`.
  - Además traer los últimos N turnos por recencia (`order by created_at desc`) para
    dar continuidad inmediata (la similitud sola pierde el hilo del último mensaje).
  - Combinar (dedupe por id), ordenar cronológicamente, devolver como lista de turnos.

### Integración en `query.controller.js` (`queryData`)

1. Al inicio, si `req.user`: `const historial = await recallRelevant(req.user.id, prompt)`.
2. Inyectar `historial` en el `userMessage`, en su propia sección (separada del RAG de
   dominio y de los datos estructurados), p.ej.:
   ```
   HISTORIAL DEL USUARIO (conversaciones previas de ESTA persona; usalo para dar
   continuidad y personalizar el tono, NO como fuente de datos duros):
   <turnos>
   ```
3. Después de obtener la respuesta de la IA (y de parsearla), si `req.user`:
   - `saveTurn(req.user.id, 'user', prompt, { regions, ecgi, model })`
   - `saveTurn(req.user.id, 'assistant', respuesta, { clusters_destacados })`
   - Hacerlo **sin bloquear** la respuesta al cliente (fire-and-forget con catch/log)
     o después de `res.json`, para no sumar latencia al chat.

### Ajuste al system prompt

En `backend/src/ai/system-prompt.md`, agregar una regla: si hay "HISTORIAL DEL
USUARIO", usarlo para personalizar (retomar temas/zonas que le interesan, mantener
coherencia), pero **sin inventar** datos a partir de él — los datos duros salen sólo de
los DATOS ESTRUCTURADOS de la consulta actual. El historial no anula la compuerta de
saludo ni las reglas de evidencia.

## Cambios — Frontend

- Mínimos. El chat ya manda el token vía `authHeaders`. Con `optionalAuth` en `/datos`,
  la memoria se activa sola para usuarios logueados.
- Opcional: indicar en la UI que la IA "recuerda" al usuario logueado, y un botón para
  **borrar mi historial** (`DELETE /api/v1/memory` → borra filas del `req.user.id`).

## Tests

- `memory.service`: `saveTurn` inserta con y sin embedding; `recallRelevant` combina
  similitud + recencia y dedupe (mockear supabase/embedText).
- `query.controller`: con `req.user`, el `userMessage` incluye la sección de historial;
  se llama `saveTurn` para user y assistant; sin `req.user`, no se toca memoria.
- RPC `match_conversation_memory`: filtra por `user_id` (no filtra memoria de otros).

## Gotchas / decisiones abiertas

- **Privacidad:** el historial es dato personal. Definir retención (¿borrar > X días?),
  RLS estricta (cada uno lo suyo) y el `DELETE` de "borrar mi historial". No mezclar
  jamás historial entre usuarios (siempre filtrar por `user_id`).
- **Costo/latencia:** cada consulta suma 1 embedding del prompt + 1 RPC + 2 inserts.
  Persistir después de responder (no en el camino crítico). Cachear/limitar `match_count`.
- **Dimensión del embedding:** si el `EMBED_MODEL` cambia, cambia la dimensión → los
  vectores viejos dejan de ser comparables. Fijar el modelo de embeddings y versionarlo
  en `metadata` si se prevé migrar.
- **Degradación:** si `embedText` devuelve `null` (sin API key), la feature no debe
  romper el chat: se guarda historial reciente sin embedding y la recuperación cae a
  sólo-recencia.
- **Ruido:** no guardar los saludos/charla (usar la misma clasificación de intención del
  prompt, o un filtro simple) para no llenar la memoria con "hola".
