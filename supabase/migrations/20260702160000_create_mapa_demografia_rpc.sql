-- Demographic profile per cluster for GET /mapa/demografia and the AI context
-- of POST /datos. Aggregates assinantes (200k individual subscriber rows) by
-- home_cluster so raw subscriber data never leaves the database (spec rule).
--
-- SECURITY DEFINER: assinantes has RLS enabled with no read policies (raw
-- subscriber rows must stay private). The function runs as owner so anon can
-- get the aggregate — and only the aggregate.

create or replace function public.mapa_demografia(p_cluster text default null)
returns table (
  cluster text,
  n_assinantes bigint,
  income jsonb,
  age_groups jsonb,
  mobility jsonb,
  pct_flagship double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      a.home_cluster,
      a.income_cluster::text as income_cluster,
      a.age_group,
      a.mobility_pattern,
      a.flag_flagship
    from public.assinantes a
    where p_cluster is null or a.home_cluster = p_cluster
  ),
  totals as (
    select
      home_cluster,
      count(*) as n_assinantes,
      round(avg(flag_flagship)::numeric, 4)::double precision as pct_flagship
    from base
    group by home_cluster
  ),
  income_dist as (
    select home_cluster, jsonb_object_agg(income_cluster, cnt order by income_cluster) as dist
    from (
      select home_cluster, income_cluster, count(*) as cnt
      from base group by home_cluster, income_cluster
    ) s
    group by home_cluster
  ),
  age_dist as (
    select home_cluster, jsonb_object_agg(age_group, cnt order by age_group) as dist
    from (
      select home_cluster, age_group, count(*) as cnt
      from base group by home_cluster, age_group
    ) s
    group by home_cluster
  ),
  mobility_dist as (
    select home_cluster, jsonb_object_agg(mobility_pattern, cnt order by mobility_pattern) as dist
    from (
      select home_cluster, mobility_pattern, count(*) as cnt
      from base group by home_cluster, mobility_pattern
    ) s
    group by home_cluster
  )
  select
    t.home_cluster,
    t.n_assinantes,
    i.dist,
    a.dist,
    m.dist,
    t.pct_flagship
  from totals t
  join income_dist i using (home_cluster)
  join age_dist a using (home_cluster)
  join mobility_dist m using (home_cluster)
  order by t.home_cluster;
$$;

grant execute on function public.mapa_demografia(text) to anon, authenticated;
