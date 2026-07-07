-- Remove the legacy Alembic-era primitive schema after replacing it with the
-- CDRView Supabase-managed schema for Issue #12.
-- Drop order matters because concentracao references antenas.

drop table if exists public.concentracao;
drop table if exists public.antenas;
drop table if exists public.alembic_version;
