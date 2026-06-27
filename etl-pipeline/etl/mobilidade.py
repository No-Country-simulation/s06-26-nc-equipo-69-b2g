from pathlib import Path

import pandas as pd

from etl.cluster_names import fix_cluster_names
from etl.files import tensor_path


CHUNK_SIZE = 500_000
LEGACY_RAT_TYPES = ("LTE", "WCDMA")


def compute_pct_legacy_tech_by_cluster(data_dir: Path, *, chunk_size: int = CHUNK_SIZE) -> dict[str, float]:
    path = tensor_path(data_dir, "tensor_mobilidade.csv")
    return compute_pct_legacy_tech_from_chunks(_legacy_chunks(path, chunk_size))


def compute_pct_legacy_tech_from_chunks(chunks) -> dict[str, float]:
    totals: dict[str, dict[str, int]] = {}

    for chunk in chunks:
        add_legacy_tech_chunk(totals, chunk)

    return pct_legacy_tech_from_totals(totals)


def add_legacy_tech_chunk(totals: dict[str, dict[str, int]], chunk: pd.DataFrame) -> None:
    chunk["cluster"] = fix_cluster_names(chunk["cluster"])
    grouped = chunk.groupby("cluster")["n_sessoes"].sum()
    legacy_mask = chunk["rat_type"].isin(LEGACY_RAT_TYPES)
    grouped_legacy = chunk[legacy_mask].groupby("cluster")["n_sessoes"].sum()

    for cluster, total in grouped.items():
        bucket = totals.setdefault(cluster, {"legacy": 0, "total": 0})
        bucket["total"] += int(total)
    for cluster, legacy in grouped_legacy.items():
        bucket = totals.setdefault(cluster, {"legacy": 0, "total": 0})
        bucket["legacy"] += int(legacy)


def pct_legacy_tech_from_totals(totals: dict[str, dict[str, int]]) -> dict[str, float]:
    return {
        cluster: (bucket["legacy"] / bucket["total"] if bucket["total"] else 0.0)
        for cluster, bucket in totals.items()
    }

def _legacy_chunks(path: Path, chunk_size: int):
    return pd.read_csv(
        path,
        usecols=["cluster", "rat_type", "n_sessoes"],
        dtype={"cluster": str, "rat_type": str, "n_sessoes": "int32"},
        chunksize=chunk_size,
    )
