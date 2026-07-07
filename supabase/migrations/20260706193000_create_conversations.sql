-- ChatGPT-style conversations: each chat thread has an id, belongs to a user
-- and groups its turns in conversation_memory.

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null default 'Nueva conversación',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_conversations_user_recency
  on public.conversations (user_id, updated_at desc);

alter table public.conversations enable row level security;

drop policy if exists conversations_owner on public.conversations;
create policy conversations_owner on public.conversations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Attach turns to a conversation. Nullable: rows saved before this migration
-- stay as user-level memory (still used for personalization recall).
alter table public.conversation_memory
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

create index if not exists idx_conversation_memory_conversation
  on public.conversation_memory (conversation_id, created_at);
