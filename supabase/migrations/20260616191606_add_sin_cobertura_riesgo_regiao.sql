-- Marks reference clusters with no observed coverage in the source tensors.
-- The ETL treats no coverage as maximum infrastructure risk and stores the flag
-- so consumers do not need to infer it from zero-valued fields.

alter table public.riesgo_regiao
  add column if not exists sin_cobertura boolean not null default false;
