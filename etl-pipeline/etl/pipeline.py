from pathlib import Path

from etl.config import Settings
from etl.database import count_rows, get_connection, upsert_riesgo_regiao
from etl.loaders import (
    load_antenas_flp,
    load_assinantes,
    load_clusters,
    load_tensor_concentracao,
    load_tensor_fluxo_vias,
    load_tensor_mobilidade,
    load_tensor_od,
    load_tensor_sequencias,
    load_tensor_tempo_deslocamento,
    read_assinantes_df,
    read_tensor_concentracao_df,
)
from etl.mobilidade import compute_pct_legacy_tech_by_cluster
from etl.score import (
    compute_concentracion,
    compute_infra,
    compute_score,
    compute_vulnerabilidad,
    nivel_riesgo,
)


def fetch_clusters_metadata(conn) -> dict[str, dict]:
    with conn.cursor() as cur:
        cur.execute("SELECT cluster, municipio, lat, lon FROM clusters")
        return {
            row[0]: {"municipio": row[1], "lat": row[2], "lon": row[3]}
            for row in cur.fetchall()
        }


def compute_riesgo_rows(
    conn,
    data_dir: Path,
    pct_legacy_tech_by_cluster: dict[str, float] | None = None,
) -> list[dict]:
    tensor_df = read_tensor_concentracao_df(data_dir)
    assinantes_df = read_assinantes_df(data_dir)
    if pct_legacy_tech_by_cluster is None:
        pct_legacy_tech_by_cluster = compute_pct_legacy_tech_by_cluster(data_dir)
    clusters_meta = fetch_clusters_metadata(conn)

    tensor_agg = tensor_df.groupby("cluster").agg(
        congestion=("congestionamento_medio", "mean"),
        drop=("drop_pct_medio", "mean"),
        n_usuarios_total=("n_usuarios", "sum"),
    )
    max_n_usuarios = int(tensor_agg["n_usuarios_total"].max()) if not tensor_agg.empty else 0

    vulnerabilidad_by_cluster = assinantes_df.groupby("home_cluster")["income_cluster"].apply(
        lambda series: compute_vulnerabilidad((series.isin(["C", "D"])).sum(), len(series))
    )
    poblacion_by_cluster = assinantes_df.groupby("home_cluster").size()

    rows = []
    for cluster, meta in clusters_meta.items():
        vulnerabilidad = float(vulnerabilidad_by_cluster.get(cluster, 0.0))
        sin_cobertura = cluster not in tensor_agg.index

        if sin_cobertura:
            infra = 1.0
            concentracion = 1.0
            congestion = 0.0
            pct_legacy_tech = 0.0
            n_usuarios_total = int(poblacion_by_cluster.get(cluster, 0))
        else:
            congestion = float(tensor_agg.loc[cluster, "congestion"])
            drop = float(tensor_agg.loc[cluster, "drop"])
            n_usuarios_total = int(tensor_agg.loc[cluster, "n_usuarios_total"])
            pct_legacy_tech = float(pct_legacy_tech_by_cluster.get(cluster, 0.0))
            infra = compute_infra(congestion, drop, pct_legacy_tech)
            concentracion = compute_concentracion(n_usuarios_total, max_n_usuarios)

        score = compute_score(infra, concentracion, vulnerabilidad)
        rows.append(
            {
                "cluster": cluster,
                "municipio": meta["municipio"],
                "lat": meta["lat"],
                "lon": meta["lon"],
                "score_riesgo": score,
                "infra": infra,
                "concentracion": concentracion,
                "vulnerabilidad": vulnerabilidad,
                "n_usuarios_total": n_usuarios_total,
                "pct_legacy_tech": pct_legacy_tech,
                "pct_renta_baja": vulnerabilidad,
                "congestion_media": congestion,
                "nivel_riesgo": nivel_riesgo(score),
                "sin_cobertura": sin_cobertura,
            }
        )

    return rows


def run_pipeline(settings: Settings) -> dict[str, int | None]:
    data_dir = settings.data_dir
    conn = get_connection(settings.postgres_url)
    try:
        clusters_loaded = load_clusters(conn, data_dir)
        clusters_count = count_rows(conn, "clusters")
        if clusters_count == 0:
            raise RuntimeError(
                "clusters is empty. Provide clusters.csv or apply the database seed before running."
            )

        antenas_count = load_antenas_flp(conn, data_dir)
        assinantes_count = load_assinantes(conn, data_dir)
        tensor_count = load_tensor_concentracao(conn, data_dir)
        tensor_fluxo_vias_count = load_tensor_fluxo_vias(conn, data_dir)
        tensor_mobilidade_count, pct_legacy_tech_by_cluster = load_tensor_mobilidade(
            conn,
            data_dir,
            max_rows=settings.mobilidade_max_rows,
            sample_mod=settings.sample_mod,
        )
        tensor_od_count = load_tensor_od(conn, data_dir)
        tensor_sequencias_count = load_tensor_sequencias(
            conn,
            data_dir,
            max_rows=settings.sequencias_max_rows,
            sample_mod=settings.sample_mod,
        )
        tensor_tempo_deslocamento_count = load_tensor_tempo_deslocamento(conn, data_dir)
        scored_count = upsert_riesgo_regiao(
            conn,
            compute_riesgo_rows(conn, data_dir, pct_legacy_tech_by_cluster),
        )

        return {
            "clusters_loaded": clusters_loaded,
            "clusters_in_db": clusters_count,
            "antenas_flp": antenas_count,
            "assinantes": assinantes_count,
            "tensor_concentracao": tensor_count,
            "tensor_fluxo_vias": tensor_fluxo_vias_count,
            "tensor_mobilidade": tensor_mobilidade_count,
            "tensor_od": tensor_od_count,
            "tensor_sequencias": tensor_sequencias_count,
            "tensor_tempo_deslocamento": tensor_tempo_deslocamento_count,
            "riesgo_regiao": scored_count,
        }
    finally:
        conn.close()
