-- Server-side aggregation for GET /mapa/concentracao.
-- Groups tensor_concentracao by antenna and day period so the API never
-- exposes the raw per-day rows (~7,920) to the frontend.

create or replace function public.mapa_concentracao(p_periodo text default 'MANHA')
returns table (
  ecgi text,
  cluster text,
  municipio text,
  periodo text,
  lat double precision,
  lon double precision,
  n_usuarios bigint,
  congestion_media double precision,
  drop_pct_media double precision
)
language sql
stable
as $$
  select
    tc.ecgi,
    tc.cluster,
    tc.municipio,
    tc.periodo,
    tc.lat,
    tc.lon,
    sum(tc.n_usuarios) as n_usuarios,
    round(avg(tc.congestionamento_medio)::numeric, 4)::double precision as congestion_media,
    round(avg(tc.drop_pct_medio)::numeric, 4)::double precision as drop_pct_media
  from public.tensor_concentracao tc
  where tc.periodo = p_periodo
  group by tc.ecgi, tc.cluster, tc.municipio, tc.periodo, tc.lat, tc.lon
  order by sum(tc.n_usuarios) desc;
$$;

grant execute on function public.mapa_concentracao(text) to anon, authenticated;
