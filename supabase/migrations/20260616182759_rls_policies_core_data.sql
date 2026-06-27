-- RLS for CDRView core data tables.
-- Aggregate/non-sensitive tables are public read. assinantes is granular subscriber
-- data, so RLS is enabled with no anon/authenticated policies.

alter table public.clusters enable row level security;
alter table public.antenas_flp enable row level security;
alter table public.tensor_concentracao enable row level security;
alter table public.riesgo_regiao enable row level security;
alter table public.assinantes enable row level security;

create policy "public read clusters" on public.clusters
  for select to anon, authenticated using (true);

create policy "public read antenas_flp" on public.antenas_flp
  for select to anon, authenticated using (true);

create policy "public read tensor_concentracao" on public.tensor_concentracao
  for select to anon, authenticated using (true);

create policy "public read riesgo_regiao" on public.riesgo_regiao
  for select to anon, authenticated using (true);
