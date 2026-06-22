import pandas as pd
from loguru import logger

REQUIRED_COLUMNS_ANTENAS = {"ecgi", "cluster", "municipio", "lat", "lon"}

REQUIRED_COLUMNS_CONCENTRACAO = {
    "ecgi",
    "day_date", "periodo",
    "n_usuarios", "n_sessoes",
    "download_bytes", "upload_bytes",
    "dur_media_s", "drop_pct_medio",
    "congestionamento_medio",
    "chamadas_total", "mensagens_total",
}

VALID_PERIODOS = {"MADRUGADA", "MANHA", "TARDE", "NOITE"}


def validate_columns(df: pd.DataFrame, required: set[str], name: str) -> None:
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{name}: missing columns: {sorted(missing)}")


def clean_antenas(df: pd.DataFrame) -> pd.DataFrame:
    validate_columns(df, REQUIRED_COLUMNS_ANTENAS, "antenas_flp")

    df = df.copy()

    df["ecgi"] = df["ecgi"].astype(str).str.strip()
    df["cluster"] = df["cluster"].astype(str).str.strip()
    df["municipio"] = df["municipio"].astype(str).str.strip()
    df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
    df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

    before = len(df)
    df = df.dropna(subset=["ecgi", "lat", "lon"])
    df = df[(df["lat"].between(-90, 90)) & (df["lon"].between(-180, 180))]
    df = df.drop_duplicates(subset=["ecgi"])
    dropped = before - len(df)
    if dropped:
        logger.warning("antenas_flp: dropped {} invalid rows", dropped)

    return df.reset_index(drop=True)


def clean_concentracao(df: pd.DataFrame) -> pd.DataFrame:
    validate_columns(df, REQUIRED_COLUMNS_CONCENTRACAO, "tensor_concentracao")

    df = df.copy()

    df["ecgi"] = df["ecgi"].astype(str).str.strip()
    df["day_date"] = df["day_date"].astype(str).str.strip()
    df["periodo"] = df["periodo"].astype(str).str.strip().str.upper()

    numeric_cols = [
        "n_usuarios", "n_sessoes",
        "download_bytes", "upload_bytes",
        "dur_media_s", "drop_pct_medio",
        "congestionamento_medio",
        "chamadas_total", "mensagens_total",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    before = len(df)
    df = df[df["periodo"].isin(VALID_PERIODOS)]
    invalid_period = before - len(df)
    if invalid_period:
        logger.warning("Dropped {} rows with invalid periodo", invalid_period)

    df = df.dropna(subset=["ecgi", "day_date", "periodo", "n_usuarios"])

    before_dedup = len(df)
    df = df.drop_duplicates(subset=["ecgi", "day_date", "periodo"])
    deduped = before_dedup - len(df)
    if deduped:
        logger.warning("Dropped {} duplicate rows", deduped)

    return df.reset_index(drop=True)
