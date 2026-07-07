-- Semantic retrieval RPC for narrative document chunks.
-- Uses cosine distance against nemotron 2048-dimension embeddings.

create or replace function public.match_documents(
  query_embedding extensions.vector(2048),
  match_count int default 5
)
returns table (
  id bigint,
  fuente text,
  seccion text,
  contenido text,
  similarity double precision
)
language sql
stable
as $$
  select
    documents_vectors.id,
    documents_vectors.fuente,
    documents_vectors.seccion,
    documents_vectors.contenido,
    1 - (documents_vectors.embedding <=> query_embedding) as similarity
  from public.documents_vectors
  where documents_vectors.embedding is not null
  order by documents_vectors.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_documents(extensions.vector(2048), int) to anon, authenticated;
