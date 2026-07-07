from pathlib import Path

import pandas as pd
import psycopg2.extras

from etl.cluster_names import fix_cluster_names
from etl.database import bulk_insert_rows, truncate_and_bulk_insert, truncate_table
from etl.files import referencia_path, tensor_path
from etl.mobilidade import add_legacy_tech_chunk, pct_legacy_tech_from_totals


CLUSTERS_COLUMNS = ["cluster", "municipio", "lat", "lon"]
ANTENAS_COLUMNS = ["ecgi", "cluster", "municipio", "lat", "lon"]
ASSINANTES_COLUMNS = [
    "assinante_hash",
    "home_cluster",
    "home_municipio",
    "income_cluster",
    "age_group",
    "mobility_pattern",
    "flag_flagship",
]
TENSOR_CONCENTRACAO_COLUMNS = [
    "ecgi",
    "cluster",
    "municipio",
    "day_date",
    "periodo",
    "n_usuarios",
    "n_sessoes",
    "download_bytes",
    "upload_bytes",
    "dur_media_s",
    "drop_pct_medio",
    "congestionamento_medio",
    "chamadas_total",
    "mensagens_total",
    "lat",
    "lon",
]
TENSOR_FLUXO_VIAS_COLUMNS = [
    "ecgi_origem",
    "lat_origem",
    "lon_origem",
    "cluster_origem",
    "municipio_origem",
    "ecgi_destino",
    "lat_destino",
    "lon_destino",
    "cluster_destino",
    "municipio_destino",
    "n_usuarios",
    "n_transicoes",
    "dist_km",
    "periodo_predominante",
    "pct_do_cluster_origem",
]
TENSOR_MOBILIDADE_COLUMNS = [
    "assinante_hash",
    "day_date",
    "ecgi",
    "cluster",
    "municipio",
    "rg_type",
    "rat_type",
    "periodo_sessao",
    "n_sessoes",
    "dur_total_s",
    "download_bytes",
    "upload_bytes",
    "drop_pct",
    "congestionamento",
    "chamadas",
    "conversacao_seg",
    "completamento_voz",
    "cong_voz",
    "mensagens",
    "completamento_sms",
    "cong_sms",
    "rg_streaming",
    "rg_game",
    "rg_social",
    "rg_comunicacao",
    "rg_outros",
    "income_cluster",
    "age_group",
    "flag_flagship",
]
TENSOR_OD_COLUMNS = [
    "cluster_origem",
    "municipio_origem",
    "lat_origem",
    "lon_origem",
    "cluster_destino",
    "municipio_destino",
    "lat_destino",
    "lon_destino",
    "mesmo_cluster",
    "n_usuarios",
    "n_viagens",
    "dist_media_km",
    "periodo_predominante",
]
TENSOR_SEQUENCIAS_COLUMNS = [
    "assinante_hash",
    "day_date",
    "seq_num",
    "ecgi",
    "cluster",
    "municipio",
    "lat",
    "lon",
    "arrival_time",
    "permanencia_seg",
    "periodo_sessao",
    "distancia_km_anterior",
    "n_sessoes",
]
TENSOR_TEMPO_DESLOCAMENTO_COLUMNS = [
    "cluster_origem",
    "cluster_destino",
    "mesmo_cluster",
    "n_observacoes",
    "dist_media_km",
    "dist_p25_km",
    "dist_p75_km",
    "periodo_predominante",
]
CHUNK_SIZE = 100_000


def load_clusters(conn, data_dir: Path) -> int | None:
    path = referencia_path(data_dir, "clusters.csv")
    if not path.exists():
        return None

    df = pd.read_csv(path, dtype={"cluster": str, "municipio": str})
    df["cluster"] = fix_cluster_names(df["cluster"])
    rows = list(df[CLUSTERS_COLUMNS].itertuples(index=False, name=None))
    with conn.cursor() as cur:
        if rows:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO clusters (cluster, municipio, lat, lon) VALUES %s
                ON CONFLICT (cluster) DO UPDATE SET
                    municipio = EXCLUDED.municipio,
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon
                """,
                rows,
            )
    conn.commit()
    return len(rows)


def load_antenas_flp(conn, data_dir: Path) -> int:
    df = pd.read_csv(
        referencia_path(data_dir, "antenas_flp.csv"),
        dtype={"ecgi": str, "cluster": str, "municipio": str},
    )
    df["cluster"] = fix_cluster_names(df["cluster"])
    rows = list(df[ANTENAS_COLUMNS].itertuples(index=False, name=None))
    return truncate_and_bulk_insert(conn, "antenas_flp", ANTENAS_COLUMNS, rows)


def load_assinantes(conn, data_dir: Path) -> int:
    df = pd.read_csv(
        referencia_path(data_dir, "assinantes.csv"),
        dtype={
            "assinante_hash": "int32",
            "home_cluster": str,
            "home_municipio": str,
            "income_cluster": str,
            "age_group": str,
            "mobility_pattern": str,
            "flag_flagship": "int8",
        },
    )
    df["home_cluster"] = fix_cluster_names(df["home_cluster"])
    rows = list(df[ASSINANTES_COLUMNS].itertuples(index=False, name=None))
    return truncate_and_bulk_insert(conn, "assinantes", ASSINANTES_COLUMNS, rows)


def load_tensor_concentracao(conn, data_dir: Path) -> int:
    return _load_csv_chunks(
        conn,
        "tensor_concentracao",
        TENSOR_CONCENTRACAO_COLUMNS,
        tensor_path(data_dir, "tensor_concentracao.csv"),
        dtype={"ecgi": str, "cluster": str, "municipio": str, "periodo": str},
        parse_dates=["day_date"],
        normalizer=_normalize_tensor_concentracao,
    )


def load_tensor_fluxo_vias(conn, data_dir: Path) -> int:
    return _load_csv_chunks(
        conn,
        "tensor_fluxo_vias",
        TENSOR_FLUXO_VIAS_COLUMNS,
        tensor_path(data_dir, "tensor_fluxo_vias.csv"),
        dtype={
            "ecgi_origem": str,
            "cluster_origem": str,
            "municipio_origem": str,
            "ecgi_destino": str,
            "cluster_destino": str,
            "municipio_destino": str,
            "periodo_predominante": str,
        },
        normalizer=_normalize_origin_dest_clusters,
    )


def load_tensor_mobilidade(
    conn, data_dir: Path, max_rows: int | None = None, sample_mod: int | None = None
) -> tuple[int, dict[str, float]]:
    totals: dict[str, dict[str, int]] = {}
    count = _load_csv_chunks(
        conn,
        "tensor_mobilidade",
        TENSOR_MOBILIDADE_COLUMNS,
        tensor_path(data_dir, "tensor_mobilidade.csv"),
        dtype={
            "assinante_hash": "int64",
            "ecgi": str,
            "cluster": str,
            "municipio": str,
            "rg_type": str,
            "rat_type": str,
            "periodo_sessao": str,
            "income_cluster": str,
            "age_group": str,
            "flag_flagship": "int8",
        },
        parse_dates=["day_date"],
        normalizer=lambda chunk: _normalize_tensor_mobilidade(chunk, totals),
        max_rows=max_rows,
        scan_full=True,
        sample_column="assinante_hash",
        sample_mod=sample_mod,
    )
    return count, pct_legacy_tech_from_totals(totals)


def load_tensor_od(conn, data_dir: Path) -> int:
    return _load_csv_chunks(
        conn,
        "tensor_od",
        TENSOR_OD_COLUMNS,
        tensor_path(data_dir, "tensor_od.csv"),
        dtype={
            "cluster_origem": str,
            "municipio_origem": str,
            "cluster_destino": str,
            "municipio_destino": str,
            "periodo_predominante": str,
            "mesmo_cluster": "int8",
        },
        normalizer=_normalize_origin_dest_clusters,
    )


def load_tensor_sequencias(
    conn, data_dir: Path, max_rows: int | None = None, sample_mod: int | None = None
) -> int:
    return _load_csv_chunks(
        conn,
        "tensor_sequencias",
        TENSOR_SEQUENCIAS_COLUMNS,
        tensor_path(data_dir, "tensor_sequencias.csv"),
        dtype={
            "assinante_hash": "int64",
            "ecgi": str,
            "cluster": str,
            "municipio": str,
            "periodo_sessao": str,
        },
        parse_dates=["day_date", "arrival_time"],
        normalizer=_normalize_tensor_sequencias,
        max_rows=max_rows,
        sample_column="assinante_hash",
        sample_mod=sample_mod,
    )


def load_tensor_tempo_deslocamento(conn, data_dir: Path) -> int:
    return _load_csv_chunks(
        conn,
        "tensor_tempo_deslocamento",
        TENSOR_TEMPO_DESLOCAMENTO_COLUMNS,
        tensor_path(data_dir, "tensor_tempo_deslocamento.csv"),
        dtype={
            "cluster_origem": str,
            "cluster_destino": str,
            "mesmo_cluster": "int8",
            "periodo_predominante": str,
        },
        normalizer=_normalize_origin_dest_clusters,
    )


def read_assinantes_df(data_dir: Path) -> pd.DataFrame:
    df = pd.read_csv(
        referencia_path(data_dir, "assinantes.csv"),
        dtype={"home_cluster": str, "income_cluster": str},
    )
    df["home_cluster"] = fix_cluster_names(df["home_cluster"])
    return df


def read_tensor_concentracao_df(data_dir: Path) -> pd.DataFrame:
    df = pd.read_csv(
        tensor_path(data_dir, "tensor_concentracao.csv"),
        dtype={"ecgi": str, "cluster": str},
    )
    df["cluster"] = fix_cluster_names(df["cluster"])
    return df


def _load_csv_chunks(
    conn,
    table: str,
    columns: list[str],
    path: Path,
    *,
    dtype: dict[str, str],
    parse_dates: list[str] | None = None,
    normalizer=None,
    chunk_size: int = CHUNK_SIZE,
    max_rows: int | None = None,
    scan_full: bool = False,
    sample_column: str | None = None,
    sample_mod: int | None = None,
) -> int:
    truncate_table(conn, table)
    total = 0
    reader = pd.read_csv(
        path,
        dtype=dtype,
        parse_dates=parse_dates,
        chunksize=chunk_size,
    )
    for chunk in reader:
        if normalizer:
            # Always runs on the full chunk so accumulators (e.g.
            # pct_legacy_tech totals) stay exact even when sampling/capping.
            normalizer(chunk)

        work = chunk
        if sample_mod is not None and sample_column is not None:
            # Representative subscriber sample, spread across all clusters.
            work = chunk[chunk[sample_column] % sample_mod == 0]

        if max_rows is not None and total >= max_rows:
            if scan_full:
                continue
            break

        rows = list(work[columns].itertuples(index=False, name=None))
        if max_rows is not None:
            rows = rows[: max_rows - total]
        total += bulk_insert_rows(conn, table, columns, rows)
    return total


def _normalize_tensor_concentracao(chunk: pd.DataFrame) -> None:
    chunk["day_date"] = chunk["day_date"].dt.date
    chunk["cluster"] = fix_cluster_names(chunk["cluster"])


def _normalize_tensor_mobilidade(
    chunk: pd.DataFrame,
    totals: dict[str, dict[str, int]],
) -> None:
    chunk["day_date"] = chunk["day_date"].dt.date
    chunk["cluster"] = fix_cluster_names(chunk["cluster"])
    add_legacy_tech_chunk(totals, chunk[["cluster", "rat_type", "n_sessoes"]].copy())


def _normalize_tensor_sequencias(chunk: pd.DataFrame) -> None:
    chunk["day_date"] = chunk["day_date"].dt.date
    chunk["cluster"] = fix_cluster_names(chunk["cluster"])


def _normalize_origin_dest_clusters(chunk: pd.DataFrame) -> None:
    if "cluster_origem" in chunk:
        chunk["cluster_origem"] = fix_cluster_names(chunk["cluster_origem"])
    if "cluster_destino" in chunk:
        chunk["cluster_destino"] = fix_cluster_names(chunk["cluster_destino"])
