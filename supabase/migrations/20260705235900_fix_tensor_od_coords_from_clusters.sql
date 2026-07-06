-- Sync tensor_od endpoint coordinates with the corrected cluster centroids.
--
-- The ETL loaded tensor_od with the old hand-seeded coordinates (up to
-- 3.2 km off) and SAO_JOSE_ROCADO rows even carry (0,0) "Null Island",
-- which drew OD flow lines across the Atlantic on the map.
-- clusters.lat/lon is the single source of truth for centroids since
-- fix_cluster_centroids_from_antenas.

update public.tensor_od t
set lat_origem = c.lat,
    lon_origem = c.lon
from public.clusters c
where c.cluster = t.cluster_origem;

update public.tensor_od t
set lat_destino = c.lat,
    lon_destino = c.lon
from public.clusters c
where c.cluster = t.cluster_destino;
