-- Traceable schema for public-service facilities ingested from OpenStreetMap.
-- Remote application is intentionally left to the orchestrator/MCP workflow.

create table if not exists public.equipamentos_publicos (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'osm',
  source_id text,
  nome text,
  tipo text,
  categoria text,
  lat double precision,
  lon double precision,
  tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists equipamentos_publicos_tipo_idx
  on public.equipamentos_publicos (tipo);

create index if not exists equipamentos_publicos_lat_lon_idx
  on public.equipamentos_publicos (lat, lon);

create index if not exists equipamentos_publicos_tags_gin_idx
  on public.equipamentos_publicos using gin (tags);

create or replace function public.set_equipamentos_publicos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_equipamentos_publicos_updated_at on public.equipamentos_publicos;
create trigger set_equipamentos_publicos_updated_at
before update on public.equipamentos_publicos
for each row
execute function public.set_equipamentos_publicos_updated_at();
