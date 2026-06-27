-- Core CDRView dataset tables and the cluster-level digital exclusion risk score.
-- The Python ETL in etl-pipeline/ loads the raw CSV-derived tables and upserts
-- riesgo_regiao after computing the score components.

create table if not exists public.clusters (
  cluster    text primary key,
  municipio  text not null,
  lat        double precision not null,
  lon        double precision not null,
  perfil     text
);

create table if not exists public.antenas_flp (
  ecgi       text primary key,
  cluster    text not null references public.clusters (cluster),
  municipio  text not null,
  lat        double precision not null,
  lon        double precision not null
);

create table if not exists public.assinantes (
  assinante_hash    integer primary key,
  home_cluster      text not null references public.clusters (cluster),
  home_municipio    text not null,
  income_cluster    char(1) not null check (income_cluster in ('A', 'B', 'C', 'D')),
  age_group         text not null,
  mobility_pattern  text not null,
  flag_flagship     smallint not null check (flag_flagship in (0, 1))
);

create index if not exists idx_assinantes_home_cluster on public.assinantes (home_cluster);

create table if not exists public.tensor_concentracao (
  id                       bigint generated always as identity primary key,
  ecgi                     text not null,
  cluster                  text not null references public.clusters (cluster),
  municipio                text not null,
  day_date                 date not null,
  periodo                  text not null check (periodo in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE')),
  n_usuarios               integer not null,
  n_sessoes                integer not null,
  download_bytes           bigint not null,
  upload_bytes             bigint not null,
  dur_media_s              integer not null,
  drop_pct_medio           real not null,
  congestionamento_medio   real not null,
  chamadas_total           integer not null,
  mensagens_total          integer not null,
  lat                      double precision not null,
  lon                      double precision not null,
  unique (ecgi, day_date, periodo)
);

create index if not exists idx_tensor_concentracao_cluster on public.tensor_concentracao (cluster);
create index if not exists idx_tensor_concentracao_periodo on public.tensor_concentracao (periodo);

create table if not exists public.riesgo_regiao (
  cluster            text primary key references public.clusters (cluster),
  municipio          text not null,
  lat                double precision not null,
  lon                double precision not null,
  score_riesgo       real not null,
  infra              real not null,
  concentracion      real not null,
  vulnerabilidad     real not null,
  n_usuarios_total   integer not null,
  pct_legacy_tech    real not null,
  pct_renta_baja     real not null,
  congestion_media   real not null,
  nivel_riesgo       text not null check (nivel_riesgo in ('ALTO', 'MEDIO', 'BAJO')),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_riesgo_regiao_score on public.riesgo_regiao (score_riesgo desc);

insert into public.clusters (cluster, municipio, lat, lon, perfil) values
  ('CBD_BEIRAMAR', 'Florianopolis', -27.5954, -48.5480, 'Centro corporativo'),
  ('CENTRO_HISTORICO', 'Florianopolis', -27.5970, -48.5482, 'Turismo / servicos'),
  ('TRINDADE', 'Florianopolis', -27.6011, -48.5320, 'Residencial universitario'),
  ('UFSC', 'Florianopolis', -27.5969, -48.5500, 'Campus universitario'),
  ('COQUEIROS', 'Florianopolis', -27.5820, -48.5700, 'Residencial classe A'),
  ('ESTREITO_CAPOEIRAS', 'Florianopolis', -27.5880, -48.5850, 'Corredor comercial'),
  ('AEROPORTO_HLZ', 'Florianopolis', -27.6700, -48.5470, 'Aeroporto / logistica'),
  ('CAMPECHE', 'Florianopolis', -27.6800, -48.4800, 'Expansao sul'),
  ('LAGOA_CONCEICAO', 'Florianopolis', -27.6050, -48.4600, 'Turismo / lazer'),
  ('JURERE', 'Florianopolis', -27.4400, -48.5000, 'Alto padrao balnear'),
  ('CANASVIEIRAS', 'Florianopolis', -27.4250, -48.4700, 'Turismo de massa'),
  ('INGLESES', 'Florianopolis', -27.4350, -48.3950, 'Residencial norte'),
  ('NORTE_ILHA', 'Florianopolis', -27.4800, -48.4500, 'Expansao norte'),
  ('RESIDENCIAL_NORTE', 'Florianopolis', -27.5420, -48.5000, 'Residencial expansao'),
  ('SC401_CORREDOR', 'Florianopolis', -27.5600, -48.5180, 'Corredor SC-401'),
  ('SAO_JOSE_CENTRO', 'Sao Jose', -27.6100, -48.6180, 'Centro de Sao Jose'),
  ('SAO_JOSE_BARREIROS', 'Sao Jose', -27.6450, -48.6500, 'Residencial sul SJ'),
  ('SAO_JOSE_KOBRASOL', 'Sao Jose', -27.5950, -48.6300, 'Comercio SJ'),
  ('SAO_JOSE_ROCADO', 'Sao Jose', -27.5700, -48.6500, 'Industrial SJ'),
  ('PALHOCA_CENTRO', 'Palhoca', -27.6450, -48.6700, 'Centro de Palhoca'),
  ('PALHOCA_PEDRA_BRANCA', 'Palhoca', -27.6250, -48.6900, 'Expansao Palhoca'),
  ('PALHOCA_BR101_SUL', 'Palhoca', -27.6800, -48.7000, 'Corredor BR-101 Sul'),
  ('BIGUACU_BR101_NORTE', 'Biguacu', -27.4950, -48.6550, 'Corredor BR-101 Norte'),
  ('VIA_EXPRESSA_CORREDOR', 'Florianopolis', -27.6200, -48.5800, 'Via Expressa'),
  ('SANTO_AMARO', 'Santo Amaro', -27.7100, -48.7800, 'Interior sul'),
  ('GOV_CELSO_RAMOS', 'Gov. C. Ramos', -27.3200, -48.5550, 'Litoral norte'),
  ('ANTONIO_CARLOS', 'Antonio Carlos', -27.5300, -48.7400, 'Hortigranjeiro / rural')
on conflict (cluster) do nothing;
