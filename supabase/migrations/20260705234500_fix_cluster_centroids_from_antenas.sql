-- Fix cluster centroids: derive them from real antenna positions.
--
-- The seed in 20260616182059_core_data_riesgo_regiao.sql hardcoded lat/lon
-- by hand, drifting up to 3.2 km from the actual antenna locations
-- (e.g. COQUEIROS rendered in the middle of Baia Norte on the map).
--
-- Clusters WITHOUT antennas (sin_cobertura zones: SANTO_AMARO,
-- ANTONIO_CARLOS, PALHOCA_BR101_SUL, GOV_CELSO_RAMOS) keep their manual
-- coordinates - there is no antenna data to derive them from.

with centroids as (
  select cluster, avg(lat) as lat, avg(lon) as lon
  from public.antenas_flp
  group by cluster
)
update public.clusters c
set lat = ct.lat,
    lon = ct.lon
from centroids ct
where ct.cluster = c.cluster;

-- riesgo_regiao carries a copy of the coordinates written by the ETL,
-- so it must be synced with the same source.
with centroids as (
  select cluster, avg(lat) as lat, avg(lon) as lon
  from public.antenas_flp
  group by cluster
)
update public.riesgo_regiao r
set lat = ct.lat,
    lon = ct.lon
from centroids ct
where ct.cluster = r.cluster;
