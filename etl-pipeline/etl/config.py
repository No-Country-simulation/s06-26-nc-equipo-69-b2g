import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv


class Settings:
    def __init__(self, env_file: str | Path | None = ".env") -> None:
        if env_file:
            load_dotenv(env_file)
        self.cdrview_data_dir = os.getenv("CDRVIEW_DATA_DIR", "./data")
        self.database_url = os.getenv("DATABASE_URL")
        self.direct_url = os.getenv("DIRECT_URL")
        self.mobilidade_max_rows = _int_or_none(os.getenv("CDRVIEW_MOBILIDADE_MAX_ROWS"))
        self.sequencias_max_rows = _int_or_none(os.getenv("CDRVIEW_SEQUENCIAS_MAX_ROWS"))
        # Representative subscriber sample: keep rows where assinante_hash % N == 0.
        # Applied to mobilidade + sequencias so the sample is coherent (same subs)
        # and spread across all clusters. None = no sampling (load full).
        self.sample_mod = _int_or_none(os.getenv("CDRVIEW_SAMPLE_MOD"))

    @property
    def data_dir(self) -> Path:
        return Path(self.cdrview_data_dir).resolve()

    @property
    def postgres_url(self) -> str:
        raw_url = self.direct_url or self.database_url
        if not raw_url:
            raise RuntimeError("DIRECT_URL or DATABASE_URL is required to run the pipeline")
        return _strip_pgbouncer_param(raw_url)


def _int_or_none(value: str | None) -> int | None:
    if value is None or value.strip() == "":
        return None
    return int(value)


def _strip_pgbouncer_param(url: str) -> str:
    parts = urlsplit(url)
    query = [(key, value) for key, value in parse_qsl(parts.query) if key != "pgbouncer"]
    return urlunsplit(parts._replace(query=urlencode(query)))
