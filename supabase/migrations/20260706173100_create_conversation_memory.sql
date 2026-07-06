-- Per-user conversation memory for AI personalization.
-- Same embedding space as documents_vectors (nemotron, 2048 dims) so the same
-- embedText() output is comparable across both tables.

create table if not exists public.conversation_memory (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  embedding   extensions.vector(2048),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_conversation_memory_user_recency
  on public.conversation_memory (user_id, created_at desc);

-- No ANN index on purpose: pgvector ivfflat/hnsw cap at 2000 dimensions and
-- these embeddings are 2048. Retrieval seq-scans only the user's rows.

alter table public.conversation_memory enable row level security;

-- Owner-only access; the backend operates with the service role (bypasses RLS).
drop policy if exists conversation_memory_owner on public.conversation_memory;
create policy conversation_memory_owner on public.conversation_memory
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Similarity retrieval scoped to one user (analogous to match_documents).
create or replace function public.match_conversation_memory(
  p_user_id uuid,
  query_embedding extensions.vector(2048),
  match_count int default 5
)
returns table (
  id bigint,
  role text,
  content text,
  created_at timestamptz,
  similarity double precision
)
language sql
stable
as $$
  select
    cm.id,
    cm.role,
    cm.content,
    cm.created_at,
    1 - (cm.embedding <=> query_embedding) as similarity
  from public.conversation_memory cm
  where cm.user_id = p_user_id and cm.embedding is not null
  order by cm.embedding <=> query_embedding
  limit match_count;
$$;

-- Personal data: no anon grant on purpose.
grant execute on function public.match_conversation_memory(uuid, extensions.vector(2048), int)
  to authenticated, service_role;
