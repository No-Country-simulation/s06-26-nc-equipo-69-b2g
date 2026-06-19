from pydantic import BaseModel, Field, field_validator


class AntenaSchema(BaseModel):
    ecgi: str = Field(..., min_length=1, description="Cell identifier -- always string")
    cluster: str = Field(..., min_length=1)
    municipio: str = Field(..., min_length=1)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)

    @field_validator("ecgi")
    @classmethod
    def ecgi_must_be_string(cls, v: str) -> str:
        return v.strip()


class ConcentracaoSchema(BaseModel):
    ecgi: str = Field(..., min_length=1, description="Cell identifier -- always string")
    cluster: str = Field(..., min_length=1)
    municipio: str = Field(..., min_length=1)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    day_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    periodo: str = Field(..., pattern=r"^(MADRUGADA|MANHA|TARDE|NOITE)$")
    n_usuarios: int = Field(..., ge=0)
    n_sessoes: int = Field(..., ge=0)
    download_bytes: int | None = None
    upload_bytes: int | None = None
    dur_media_s: float | None = Field(None, ge=0)
    drop_pct_medio: float | None = Field(None, ge=0.0, le=1.0)
    congestionamento_medio: float | None = Field(None, ge=0.0, le=1.0)
    chamadas_total: int | None = Field(None, ge=0)
    mensagens_total: int | None = Field(None, ge=0)

    @field_validator("ecgi")
    @classmethod
    def ecgi_must_be_string(cls, v: str) -> str:
        return v.strip()
