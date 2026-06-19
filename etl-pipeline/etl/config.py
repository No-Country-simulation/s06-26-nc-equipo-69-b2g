from pathlib import Path
from urllib.parse import urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_type: str = "sqlite"
    sqlite_path: str = "data/visent.db"
    database_url: str | None = None
    ssl_mode: str = "require"
    data_dir: str = "data"
    concentracao_csv: str = "data/tensor_concentracao.csv"
    antenas_csv: str = "data/antenas_flp.csv"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_concentracao_csv(self) -> Path:
        return Path(self.concentracao_csv).resolve()

    @property
    def resolved_antenas_csv(self) -> Path:
        return Path(self.antenas_csv).resolve()

    @property
    def resolved_sqlite_path(self) -> Path:
        return Path(self.sqlite_path).resolve()

    @property
    def is_sqlite(self) -> bool:
        return self.db_type == "sqlite"

    @property
    def is_postgres(self) -> bool:
        return self.db_type == "postgresql"

    def sqlalchemy_url(self) -> str:
        if self.is_sqlite:
            return f"sqlite:///{self.resolved_sqlite_path}"
        if not self.database_url:
            raise ValueError("DATABASE_URL is required when DB_TYPE=postgresql")
        url = self.database_url
        if self.is_postgres and self.ssl_mode:
            parsed = urlparse(url)
            if parsed.scheme in ("postgresql", "postgres"):
                qs = dict(pair.split("=", 1) for pair in parsed.query.split("&") if pair)
                if "sslmode" not in qs:
                    qs["sslmode"] = self.ssl_mode
                    new_qs = urlencode(qs)
                    url = urlunparse(parsed._replace(query=new_qs))
        return url
