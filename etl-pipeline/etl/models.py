from sqlalchemy import BigInteger, Column, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Antena(Base):
    __tablename__ = "antenas"

    ecgi = Column(Text, primary_key=True)
    cluster = Column(String(40), nullable=False)
    municipio = Column(String(60), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    concentracoes = relationship("Concentracao", back_populates="antena")

    def __repr__(self) -> str:
        return f"<Antena ecgi={self.ecgi} cluster={self.cluster}>"


class Concentracao(Base):
    __tablename__ = "concentracao"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ecgi = Column(Text, ForeignKey("antenas.ecgi"), nullable=False, index=True)
    day_date = Column(String(10), nullable=False)
    periodo = Column(String(12), nullable=False)
    n_usuarios = Column(Integer, nullable=False)
    n_sessoes = Column(Integer, nullable=False)
    download_bytes = Column(BigInteger, nullable=True)
    upload_bytes = Column(BigInteger, nullable=True)
    dur_media_s = Column(Float, nullable=True)
    drop_pct_medio = Column(Float, nullable=True)
    congestionamento_medio = Column(Float, nullable=True)
    chamadas_total = Column(Integer, nullable=True)
    mensagens_total = Column(Integer, nullable=True)

    antena = relationship("Antena", back_populates="concentracoes")

    __table_args__ = (
        UniqueConstraint("ecgi", "day_date", "periodo", name="uq_conc_ecgi_dia_periodo"),
        Index("idx_conc_periodo", "periodo"),
        Index("idx_conc_dia", "day_date"),
        Index("idx_conc_dia_periodo", "day_date", "periodo"),
        Index("idx_conc_ecgi_periodo", "ecgi", "periodo"),
    )

    def __repr__(self) -> str:
        return (
            f"<Concentracao ecgi={self.ecgi} "
            f"date={self.day_date} periodo={self.periodo}>"
        )
