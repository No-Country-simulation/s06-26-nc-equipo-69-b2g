import pytest
from pathlib import Path
from sqlalchemy import text

from etl.config import Settings
from etl.database import get_engine, session_scope
from etl.models import Antena, Base, Concentracao
from etl.pipeline import run_pipeline, create_tables


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    db_path = tmp_path / "test_visent.db"
    return Settings(
        db_type="sqlite",
        sqlite_path=str(db_path),
        concentracao_csv=str(
            Path(__file__).resolve().parent.parent / "data" / "tensor_concentracao.csv"
        ),
        antenas_csv=str(
            Path(__file__).resolve().parent.parent / "data" / "antenas_flp.csv"
        ),
    )


def test_pipeline_imports() -> None:
    from etl import config, models, schemas, clean, database, pipeline  # noqa: F401

    assert True


def test_settings_defaults() -> None:
    s = Settings(_env_file=None)
    assert s.db_type == "sqlite"
    assert s.is_sqlite is True
    assert s.is_postgres is False


def test_engine_creation_sqlite(settings: Settings) -> None:
    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    assert engine is not None

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.scalar() == 1

    engine.dispose()


def test_create_tables(settings: Settings) -> None:
    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    create_tables(engine)

    with engine.connect() as conn:
        insp = __import__("sqlalchemy").inspect(engine)
        tables = set(insp.get_table_names())
        assert "antenas" in tables
        assert "concentracao" in tables

    engine.dispose()


def test_schema_concentracao(settings: Settings) -> None:
    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    create_tables(engine)

    with engine.connect() as conn:
        columns = {
            row.name
            for row in conn.execute(text("PRAGMA table_info('concentracao')"))
        }

    expected = {
        "id", "ecgi", "cluster", "municipio", "lat", "lon",
        "day_date", "periodo", "n_usuarios", "n_sessoes",
        "download_bytes", "upload_bytes", "dur_media_s",
        "drop_pct_medio", "congestionamento_medio",
        "chamadas_total", "mensagens_total",
    }
    assert expected.issubset(columns), f"Missing: {expected - columns}"

    engine.dispose()


def test_schema_antenas(settings: Settings) -> None:
    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    create_tables(engine)

    with engine.connect() as conn:
        pk_cols = {
            row.name
            for row in conn.execute(
                text("SELECT name FROM pragma_table_info('antenas') WHERE pk = 1")
            )
        }
        assert pk_cols == {"ecgi"}, f"PK should be ecgi, got {pk_cols}"

        columns = {
            row.name
            for row in conn.execute(text("PRAGMA table_info('antenas')"))
        }

    expected = {"ecgi", "cluster", "municipio", "lat", "lon"}
    assert columns == expected, f"Expected {expected}, got {columns}"

    engine.dispose()


def test_run_pipeline_full(settings: Settings) -> None:
    results = run_pipeline(settings)

    antenas = results["antenas_flp"]
    assert antenas["raw"] == 132
    assert antenas["validated"] == 132
    assert antenas["loaded"] == 132
    assert antenas["in_db"] == 132

    concentracao = results["tensor_concentracao"]
    assert concentracao["raw"] == 7920
    assert concentracao["validated"] == 7920
    assert concentracao["loaded"] == 7920
    assert concentracao["in_db"] == 7920


def test_run_pipeline_dry_run(settings: Settings) -> None:
    results = run_pipeline(settings, dry_run=True)

    assert results["antenas_flp"]["raw"] == 132
    assert results["antenas_flp"]["loaded"] == 0
    assert "in_db" not in results["antenas_flp"]

    assert results["tensor_concentracao"]["raw"] == 7920
    assert results["tensor_concentracao"]["loaded"] == 0
    assert "in_db" not in results["tensor_concentracao"]


def test_run_pipeline_idempotent(settings: Settings) -> None:
    r1 = run_pipeline(settings)
    assert r1["antenas_flp"]["loaded"] == 132
    assert r1["tensor_concentracao"]["loaded"] == 7920

    r2 = run_pipeline(settings)
    assert r2["antenas_flp"]["loaded"] == 0
    assert r2["tensor_concentracao"]["loaded"] == 7920


def test_run_pipeline_force(settings: Settings) -> None:
    run_pipeline(settings)
    results = run_pipeline(settings, force=True)

    assert results["antenas_flp"]["in_db"] == 132
    assert results["tensor_concentracao"]["in_db"] == 7920


def test_data_integrity_concentracao(settings: Settings) -> None:
    run_pipeline(settings)

    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    with session_scope(engine) as session:
        total = session.query(Concentracao).count()
        assert total == 7920

        periodos = {
            row[0]
            for row in session.query(Concentracao.periodo).distinct().all()
        }
        assert periodos == {"MADRUGADA", "MANHA", "TARDE", "NOITE"}

        distinct_ecgi = session.query(Concentracao.ecgi).distinct().count()
        assert distinct_ecgi == 132

    engine.dispose()


def test_data_integrity_antenas(settings: Settings) -> None:
    run_pipeline(settings)

    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    with session_scope(engine) as session:
        total = session.query(Antena).count()
        assert total == 132

    engine.dispose()


def test_no_duplicate_concentracao(settings: Settings) -> None:
    run_pipeline(settings)

    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    with session_scope(engine) as session:
        from sqlalchemy import func

        dup_count = (
            session.query(
                Concentracao.ecgi,
                Concentracao.day_date,
                Concentracao.periodo,
                func.count().label("cnt"),
            ).group_by(
                Concentracao.ecgi,
                Concentracao.day_date,
                Concentracao.periodo,
            ).having(func.count() > 1).count()
        )
        assert dup_count == 0, f"Found {dup_count} duplicate groups"

    engine.dispose()


def test_antenas_pk_enforced(settings: Settings) -> None:
    run_pipeline(settings)

    engine = get_engine(settings.sqlalchemy_url(), "sqlite")
    with session_scope(engine) as session:
        total = session.query(Antena).count()
        assert total == 132

        distinct = session.query(Antena.ecgi).distinct().count()
        assert distinct == 132

    engine.dispose()
