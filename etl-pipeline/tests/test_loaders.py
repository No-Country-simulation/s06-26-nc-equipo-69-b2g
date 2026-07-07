from pathlib import Path

from etl.files import referencia_path, tensor_path
from etl.loaders import _load_csv_chunks


def test_data_path_prefers_nested_layout(tmp_path: Path):
    referencias = tmp_path / "referencias"
    tensores = tmp_path / "tensores"
    referencias.mkdir()
    tensores.mkdir()
    (referencias / "assinantes.csv").write_text("home_cluster\nA\n", encoding="utf-8")
    (tensores / "tensor_od.csv").write_text("cluster_origem\nA\n", encoding="utf-8")

    assert referencia_path(tmp_path, "assinantes.csv") == referencias / "assinantes.csv"
    assert tensor_path(tmp_path, "tensor_od.csv") == tensores / "tensor_od.csv"


def test_load_csv_chunks_truncates_once_and_inserts_each_chunk(tmp_path: Path, monkeypatch):
    path = tmp_path / "sample.csv"
    path.write_text("cluster,n_sessoes\nA,1\nB,2\nC,3\n", encoding="utf-8")
    calls = {"truncate": 0, "inserted": []}

    def fake_truncate(conn, table):
        calls["truncate"] += 1
        assert table == "sample_table"

    def fake_bulk_insert(conn, table, columns, rows):
        assert table == "sample_table"
        assert columns == ["cluster", "n_sessoes"]
        calls["inserted"].append(rows)
        return len(rows)

    monkeypatch.setattr("etl.loaders.truncate_table", fake_truncate)
    monkeypatch.setattr("etl.loaders.bulk_insert_rows", fake_bulk_insert)

    count = _load_csv_chunks(
        object(),
        "sample_table",
        ["cluster", "n_sessoes"],
        path,
        dtype={"cluster": str, "n_sessoes": "int32"},
        chunk_size=2,
    )

    assert count == 3
    assert calls["truncate"] == 1
    assert calls["inserted"] == [[("A", 1), ("B", 2)], [("C", 3)]]


def _csv_chunks_with_fakes(tmp_path, monkeypatch, *, max_rows, scan_full):
    path = tmp_path / "sample.csv"
    path.write_text(
        "cluster,n_sessoes\nA,1\nB,2\nC,3\nD,4\nE,5\nF,6\nG,7\n", encoding="utf-8"
    )
    calls = {"inserted": [], "normalized_rows": 0}

    def fake_bulk_insert(conn, table, columns, rows):
        calls["inserted"].append(rows)
        return len(rows)

    def fake_normalizer(chunk):
        calls["normalized_rows"] += len(chunk)

    monkeypatch.setattr("etl.loaders.truncate_table", lambda conn, table: None)
    monkeypatch.setattr("etl.loaders.bulk_insert_rows", fake_bulk_insert)

    count = _load_csv_chunks(
        object(),
        "sample_table",
        ["cluster", "n_sessoes"],
        path,
        dtype={"cluster": str, "n_sessoes": "int32"},
        chunk_size=2,
        normalizer=fake_normalizer,
        max_rows=max_rows,
        scan_full=scan_full,
    )
    return count, calls


def test_max_rows_caps_inserted_rows_and_stops_early(tmp_path: Path, monkeypatch):
    count, calls = _csv_chunks_with_fakes(
        tmp_path, monkeypatch, max_rows=3, scan_full=False
    )

    assert count == 3
    assert calls["inserted"] == [[("A", 1), ("B", 2)], [("C", 3)]]
    # scan_full=False breaks after the cap: the final [G] chunk is never read,
    # so only 6 of the 7 rows reach the normalizer.
    assert calls["normalized_rows"] == 6


def test_scan_full_normalizes_whole_file_but_caps_inserts(tmp_path: Path, monkeypatch):
    count, calls = _csv_chunks_with_fakes(
        tmp_path, monkeypatch, max_rows=3, scan_full=True
    )

    assert count == 3
    assert calls["inserted"] == [[("A", 1), ("B", 2)], [("C", 3)]]
    # scan_full=True keeps scanning so the normalizer sees all 7 rows.
    assert calls["normalized_rows"] == 7


def test_sample_mod_keeps_only_matching_subscribers(tmp_path: Path, monkeypatch):
    path = tmp_path / "sample.csv"
    # assinante_hash 1..6; sample_mod=2 keeps even hashes (2, 4, 6).
    path.write_text(
        "assinante_hash,cluster\n1,A\n2,B\n3,A\n4,C\n5,A\n6,B\n", encoding="utf-8"
    )
    inserted = []

    monkeypatch.setattr("etl.loaders.truncate_table", lambda conn, table: None)
    monkeypatch.setattr(
        "etl.loaders.bulk_insert_rows",
        lambda conn, table, columns, rows: (inserted.extend(rows), len(rows))[1],
    )

    count = _load_csv_chunks(
        object(),
        "sample_table",
        ["assinante_hash", "cluster"],
        path,
        dtype={"assinante_hash": "int64", "cluster": str},
        chunk_size=4,
        sample_column="assinante_hash",
        sample_mod=2,
    )

    assert count == 3
    assert inserted == [(2, "B"), (4, "C"), (6, "B")]
