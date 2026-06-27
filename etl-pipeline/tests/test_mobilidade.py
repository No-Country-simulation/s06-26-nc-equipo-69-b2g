from pathlib import Path

from etl.mobilidade import compute_pct_legacy_tech_by_cluster


def test_compute_pct_legacy_tech_reads_mobilidade_in_chunks(tmp_path: Path):
    data_dir = tmp_path
    (data_dir / "tensor_mobilidade.csv").write_text(
        "cluster,rat_type,n_sessoes\n"
        "A,LTE,10\n"
        "A,NR,30\n"
        "B,WCDMA,5\n"
        "B,NR,5\n"
        "SAO_JOSE_ROÇADO,LTE,7\n",
        encoding="utf-8",
    )

    result = compute_pct_legacy_tech_by_cluster(data_dir, chunk_size=2)

    assert result["A"] == 0.25
    assert result["B"] == 0.5
    assert result["SAO_JOSE_ROCADO"] == 1.0
