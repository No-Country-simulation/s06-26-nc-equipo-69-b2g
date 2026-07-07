-- Narrative document chunks and embeddings used by downstream context retrieval.
-- This migration only creates the storage table; it does not port backend RAG,
-- prompt, OpenRouter, or API code.

create extension if not exists vector with schema extensions;

create table if not exists public.documents_vectors (
  id          bigint generated always as identity primary key,
  fuente      text not null,
  seccion     text not null,
  contenido   text not null,
  embedding   extensions.vector(2048),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_documents_vectors_fuente on public.documents_vectors (fuente);

alter table public.documents_vectors enable row level security;

create policy "public read documents_vectors" on public.documents_vectors
  for select to anon, authenticated using (true);
