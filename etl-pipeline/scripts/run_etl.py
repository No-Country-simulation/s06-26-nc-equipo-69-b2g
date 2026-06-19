#!/usr/bin/env python3
"""App BiT -- ETL Pipeline CLI

Usage:
    python scripts/run_etl.py --db sqlite          Local SQLite
    python scripts/run_etl.py --db postgresql       Supabase/PostgreSQL
    python scripts/run_etl.py --db sqlite --dry-run Preview only
    python scripts/run_etl.py --db sqlite --force   Truncate + reload
"""

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

import typer
from loguru import logger

from etl.config import Settings
from etl.pipeline import run_pipeline
from etl.utils import setup_logging


def main(
    db: str = typer.Option(
        "sqlite",
        "--db",
        help="Database type: sqlite | postgresql",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        "-n",
        help="Validate without writing",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        "-f",
        help="Truncate and reload existing data",
    ),
    env_file: str = typer.Option(
        ".env",
        "--env-file",
        help="Path to .env file",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable debug logging",
    ),
) -> None:
    setup_logging(verbose)

    if db not in ("sqlite", "postgresql"):
        logger.error("Invalid --db '{}'. Use 'sqlite' or 'postgresql'", db)
        raise typer.Exit(code=1)

    env_path = Path(env_file).resolve()
    if not env_path.exists():
        logger.warning(".env file not found at '{}' -- using defaults", env_path)

    settings = Settings(_env_file=str(env_path) if env_path.exists() else None)
    settings.db_type = db

    if dry_run:
        logger.info("-- DRY RUN -- no data will be written --")

    try:
        results = run_pipeline(settings, dry_run=dry_run, force=force)

        summary_lines = [
            "",
            f"  {'=' * 50}",
            f"  {'Summary':^50}",
            f"  {'=' * 50}",
        ]

        for label, display in [("antenas_flp", "antenas_flp.csv"), ("tensor_concentracao", "tensor_concentracao.csv")]:
            r = results.get(label, {})
            loaded_label = "Loaded" if not dry_run else "Would load"
            summary_lines += [
                f"  Source: {display}",
                f"    Raw rows:      {r.get('raw', 0):>8}",
                f"    Validated:     {r.get('validated', 0):>8}",
                f"    {loaded_label}:        {r.get('loaded', 0):>8}",
            ]

        summary_lines.append(f"  {'=' * 50}")

        if not dry_run:
            for label, display in [("antenas_flp", "Antenas"), ("tensor_concentracao", "Concentracao")]:
                r = results.get(label, {})
                if "in_db" in r:
                    summary_lines += [
                        f"  {display} in DB:   {r['in_db']:>8}",
                    ]
            summary_lines.append(f"  {'=' * 50}")

        typer.echo("\n".join(summary_lines))

    except Exception:
        logger.exception("Pipeline failed")
        raise typer.Exit(code=1)


if __name__ == "__main__":
    typer.run(main)
