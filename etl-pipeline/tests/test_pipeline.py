from pathlib import Path

from etl.pipeline import compute_riesgo_rows


class FakeCursor:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def execute(self, sql: str) -> None:
        self.sql = sql

    def fetchall(self):
        return [
            ("A", "Florianopolis", -27.1, -48.1),
            ("B", "Florianopolis", -27.2, -48.2),
        ]


class FakeConnection:
    def cursor(self):
        return FakeCursor()


def test_compute_riesgo_rows_includes_components_and_sin_cobertura(tmp_path: Path):
    (tmp_path / "tensor_concentracao.csv").write_text(
        "ecgi,cluster,congestionamento_medio,drop_pct_medio,n_usuarios\n"
        "001,A,0.3,0.6,100\n",
        encoding="utf-8",
    )
    (tmp_path / "assinantes.csv").write_text(
        "home_cluster,income_cluster\n"
        "A,C\n"
        "A,B\n"
        "B,D\n",
        encoding="utf-8",
    )
    (tmp_path / "tensor_mobilidade.csv").write_text(
        "cluster,rat_type,n_sessoes\n"
        "A,LTE,10\n"
        "A,NR,30\n",
        encoding="utf-8",
    )

    rows = {row["cluster"]: row for row in compute_riesgo_rows(FakeConnection(), tmp_path)}

    assert rows["A"]["sin_cobertura"] is False
    assert rows["A"]["pct_legacy_tech"] == 0.25
    assert rows["A"]["concentracion"] == 1.0
    assert rows["A"]["vulnerabilidad"] == 0.5
    assert rows["A"]["nivel_riesgo"] == "MEDIO"

    assert rows["B"]["sin_cobertura"] is True
    assert rows["B"]["infra"] == 1.0
    assert rows["B"]["concentracion"] == 1.0
    assert rows["B"]["n_usuarios_total"] == 1
    assert rows["B"]["nivel_riesgo"] == "ALTO"
