-- Remaining CDRView tensor tables used by product analytics.

create table if not exists public.tensor_fluxo_vias (
  id                     bigint generated always as identity primary key,
  ecgi_origem            text not null,
  lat_origem             double precision not null,
  lon_origem             double precision not null,
  cluster_origem         text not null references public.clusters (cluster),
  municipio_origem       text not null,
  ecgi_destino           text not null,
  lat_destino            double precision not null,
  lon_destino            double precision not null,
  cluster_destino        text not null references public.clusters (cluster),
  municipio_destino      text not null,
  n_usuarios             integer not null,
  n_transicoes           integer not null,
  dist_km                real not null,
  periodo_predominante   text not null check (periodo_predominante in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE')),
  pct_do_cluster_origem  real not null
);

create index if not exists idx_tensor_fluxo_vias_cluster_origem on public.tensor_fluxo_vias (cluster_origem);
create index if not exists idx_tensor_fluxo_vias_cluster_destino on public.tensor_fluxo_vias (cluster_destino);
create index if not exists idx_tensor_fluxo_vias_periodo on public.tensor_fluxo_vias (periodo_predominante);

create table if not exists public.tensor_mobilidade (
  id                   bigint generated always as identity primary key,
  assinante_hash       bigint not null,
  day_date             date not null,
  ecgi                 text not null,
  cluster              text not null references public.clusters (cluster),
  municipio            text not null,
  rg_type              text not null,
  rat_type             text not null,
  periodo_sessao       text not null check (periodo_sessao in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE')),
  n_sessoes            integer not null,
  dur_total_s          integer not null,
  download_bytes       bigint not null,
  upload_bytes         bigint not null,
  drop_pct             real not null,
  congestionamento     real not null,
  chamadas             integer not null,
  conversacao_seg      integer not null,
  completamento_voz    real not null,
  cong_voz             real not null,
  mensagens            integer not null,
  completamento_sms    real not null,
  cong_sms             real not null,
  rg_streaming         integer not null,
  rg_game              integer not null,
  rg_social            integer not null,
  rg_comunicacao       integer not null,
  rg_outros            integer not null,
  income_cluster       char(1) not null check (income_cluster in ('A', 'B', 'C', 'D')),
  age_group            text not null,
  flag_flagship        smallint not null check (flag_flagship in (0, 1))
);

create index if not exists idx_tensor_mobilidade_assinante_hash on public.tensor_mobilidade (assinante_hash);
create index if not exists idx_tensor_mobilidade_day_date on public.tensor_mobilidade (day_date);
create index if not exists idx_tensor_mobilidade_cluster_day on public.tensor_mobilidade (cluster, day_date);
create index if not exists idx_tensor_mobilidade_cluster_periodo on public.tensor_mobilidade (cluster, periodo_sessao);

create table if not exists public.tensor_od (
  id                    bigint generated always as identity primary key,
  cluster_origem        text not null references public.clusters (cluster),
  municipio_origem      text not null,
  lat_origem            double precision not null,
  lon_origem            double precision not null,
  cluster_destino       text not null references public.clusters (cluster),
  municipio_destino     text not null,
  lat_destino           double precision not null,
  lon_destino           double precision not null,
  mesmo_cluster         smallint not null check (mesmo_cluster in (0, 1)),
  n_usuarios            integer not null,
  n_viagens             integer not null,
  dist_media_km         real not null,
  periodo_predominante  text not null check (periodo_predominante in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE'))
);

create index if not exists idx_tensor_od_cluster_origem on public.tensor_od (cluster_origem);
create index if not exists idx_tensor_od_cluster_destino on public.tensor_od (cluster_destino);
create index if not exists idx_tensor_od_periodo on public.tensor_od (periodo_predominante);

create table if not exists public.tensor_sequencias (
  id                     bigint generated always as identity primary key,
  assinante_hash         bigint not null,
  day_date               date not null,
  seq_num                integer not null,
  ecgi                   text not null,
  cluster                text not null references public.clusters (cluster),
  municipio              text not null,
  lat                    double precision not null,
  lon                    double precision not null,
  arrival_time           timestamptz not null,
  permanencia_seg        integer not null,
  periodo_sessao         text not null check (periodo_sessao in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE')),
  distancia_km_anterior  real not null,
  n_sessoes              integer not null
);

create index if not exists idx_tensor_sequencias_assinante_day on public.tensor_sequencias (assinante_hash, day_date);
create index if not exists idx_tensor_sequencias_cluster_day on public.tensor_sequencias (cluster, day_date);
create index if not exists idx_tensor_sequencias_arrival_time on public.tensor_sequencias (arrival_time);

create table if not exists public.tensor_tempo_deslocamento (
  id                    bigint generated always as identity primary key,
  cluster_origem        text not null references public.clusters (cluster),
  cluster_destino       text not null references public.clusters (cluster),
  mesmo_cluster         smallint not null check (mesmo_cluster in (0, 1)),
  n_observacoes         integer not null,
  dist_media_km         real not null,
  dist_p25_km           real not null,
  dist_p75_km           real not null,
  periodo_predominante  text not null check (periodo_predominante in ('MADRUGADA', 'MANHA', 'TARDE', 'NOITE'))
);

create index if not exists idx_tensor_tempo_deslocamento_cluster_origem on public.tensor_tempo_deslocamento (cluster_origem);
create index if not exists idx_tensor_tempo_deslocamento_cluster_destino on public.tensor_tempo_deslocamento (cluster_destino);
create index if not exists idx_tensor_tempo_deslocamento_periodo on public.tensor_tempo_deslocamento (periodo_predominante);

alter table public.tensor_fluxo_vias enable row level security;
alter table public.tensor_mobilidade enable row level security;
alter table public.tensor_od enable row level security;
alter table public.tensor_sequencias enable row level security;
alter table public.tensor_tempo_deslocamento enable row level security;

create policy "public read tensor_fluxo_vias" on public.tensor_fluxo_vias
  for select to anon, authenticated using (true);

create policy "public read tensor_od" on public.tensor_od
  for select to anon, authenticated using (true);

create policy "public read tensor_tempo_deslocamento" on public.tensor_tempo_deslocamento
  for select to anon, authenticated using (true);
