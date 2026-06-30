#!/usr/bin/env python3
"""App BiT -- CDRView data pipeline CLI

Usage:
    python scripts/run_etl.py
    python scripts/run_etl.py --env-file .env.local
"""

import sys
from argparse import ArgumentParser
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from etl.config import Settings
from etl.pipeline import run_pipeline


def main() -> int:
    parser = ArgumentParser(description="Run the CDRView data pipeline")
    parser.add_argument("--env-file", default=".env", help="Path to .env file")
    args = parser.parse_args()

    env_path = Path(args.env_file).resolve()
    settings = Settings(env_file=env_path if env_path.exists() else None)

    try:
        results = run_pipeline(settings)
    except Exception as exc:
        print(f"Pipeline failed: {exc}", file=sys.stderr)
        return 1

    print("Pipeline completed:")
    print(f"  clusters loaded from CSV: {results['clusters_loaded']}")
    print(f"  clusters in DB: {results['clusters_in_db']}")
    print(f"  antenas_flp loaded: {results['antenas_flp']}")
    print(f"  assinantes loaded: {results['assinantes']}")
    print(f"  tensor_concentracao loaded: {results['tensor_concentracao']}")
    print(f"  riesgo_regiao upserted: {results['riesgo_regiao']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
