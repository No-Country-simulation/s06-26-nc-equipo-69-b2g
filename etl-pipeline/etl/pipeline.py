from collections.abc import Sequence
from pathlib import Path

import pandas as pd
from loguru import logger
from sqlalchemy import Engine, text

from etl.clean import clean_antenas, clean_concentracao
from etl.config import Settings
from etl.database import get_engine, session_scope
from etl.models import Antena, Base, Concentracao
from etl.schemas import AntenaSchema, ConcentracaoSchema


def extract_csv(path: Path, dtype: dict | None = None) -> pd.DataFrame:
    logger.info("Extracting {}", path)
    return pd.read_csv(path, dtype=dtype or {})


def validate_records(df: pd.DataFrame, schema_model: type) -> list[dict]:
    logger.info("Validating {} rows with Pydantic", len(df))
    records = df.to_dict(orient="records")
    valid = []
    errors = 0
    for i, row in enumerate(records):
        try:
            validated = schema_model(**row)
            valid.append(validated.model_dump())
        except Exception as e:
            errors += 1
            if errors <= 5:
                logger.warning("Row {} validation error: {} -- data: {}", i, e, row)
    if errors:
        logger.warning("Total validation errors: {}", errors)
    return valid


def create_tables(engine: Engine) -> None:
    logger.info("Creating tables if not exist...")
    Base.metadata.create_all(engine)
    logger.info("Tables verified/created successfully")


def truncate_tables(engine: Engine) -> None:
    logger.info("Dropping and recreating tables...")
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    logger.info("Tables recreated successfully")


def _dialect_insert(model: type, dialect_name: str):
    if dialect_name == "sqlite":
        from sqlalchemy.dialects.sqlite import insert as ins
    elif dialect_name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert as ins
    else:
        ins = __import__("sqlalchemy").insert
    return ins(model).on_conflict_do_nothing()


def load_records(engine: Engine, model: type, records: list[dict]) -> int:
    logger.info("Loading {} records into {}...", len(records), model.__tablename__)
    with session_scope(engine) as session:
        before = session.query(model).count()
        stmt = _dialect_insert(model, engine.dialect.name)
        session.execute(stmt, records)
    with session_scope(engine) as session:
        after = session.query(model).count()
    inserted = after - before
    logger.success(
        "Inserted {} records into {} ({} skipped)",
        inserted, model.__tablename__, len(records) - inserted,
    )
    return inserted


def run_pipeline(
    settings: Settings,
    *,
    dry_run: bool = False,
    force: bool = False,
) -> dict:
    logger.info("=" * 60)
    logger.info("App BiT -- ETL Pipeline")
    logger.info("Database type: {}", settings.db_type)
    logger.info("Dry run: {}", dry_run)
    logger.info("=" * 60)

    engine = get_engine(settings.sqlalchemy_url(), settings.db_type)

    if not dry_run:
        create_tables(engine)
        if force:
            truncate_tables(engine)

    datasets: Sequence[tuple[str, Path, type, pd.DataFrame]] = [
        ("antenas_flp.csv", settings.resolved_antenas_csv, AntenaSchema, None),
        ("tensor_concentracao.csv", settings.resolved_concentracao_csv, ConcentracaoSchema, None),
    ]

    results = {}

    for name, path, schema_model, _ in datasets:
        logger.info("--- Processing {} ---", name)

        df = extract_csv(path, dtype={"ecgi": str})

        if name == "antenas_flp.csv":
            df = clean_antenas(df)
        elif name == "tensor_concentracao.csv":
            df = clean_concentracao(df)

        validated = validate_records(df, schema_model)

        label = name.replace(".csv", "")
        result = {
            "raw": int(len(df)),
            "validated": len(validated),
            "loaded": 0,
        }

        logger.info(
            "{}: {} raw -> {} clean -> {} validated",
            label, len(df), len(df), len(validated),
        )

        if not dry_run:
            model_class = Antena if name == "antenas_flp.csv" else Concentracao
            result["loaded"] = load_records(engine, model_class, validated)

        results[label] = result

    if not dry_run:
        engine.dispose()
        engine = get_engine(settings.sqlalchemy_url(), settings.db_type)
        results["antenas_flp"]["in_db"] = count_rows(engine, "antenas")
        results["tensor_concentracao"]["in_db"] = count_rows(engine, "concentracao")
        engine.dispose()

    logger.info("=" * 60)
    logger.info("Pipeline completed")
    logger.info("=" * 60)

    return results


def count_rows(engine: Engine, table_name: str) -> int:
    with session_scope(engine) as session:
        return session.execute(
            text(f"SELECT COUNT(*) FROM {table_name}")
        ).scalar()
