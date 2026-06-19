"""create concentracao table

Revision ID: 001
Revises:
Create Date: 2026-06-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "concentracao",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ecgi", sa.Text(), nullable=False),
        sa.Column("cluster", sa.String(40), nullable=False),
        sa.Column("municipio", sa.String(60), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("day_date", sa.String(10), nullable=False),
        sa.Column("periodo", sa.String(12), nullable=False),
        sa.Column("n_usuarios", sa.Integer(), nullable=False),
        sa.Column("n_sessoes", sa.Integer(), nullable=False),
        sa.Column("download_bytes", sa.BigInteger(), nullable=True),
        sa.Column("upload_bytes", sa.BigInteger(), nullable=True),
        sa.Column("dur_media_s", sa.Float(), nullable=True),
        sa.Column("drop_pct_medio", sa.Float(), nullable=True),
        sa.Column("congestionamento_medio", sa.Float(), nullable=True),
        sa.Column("chamadas_total", sa.Integer(), nullable=True),
        sa.Column("mensagens_total", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_conc_ecgi", "concentracao", ["ecgi"])
    op.create_index("idx_conc_periodo", "concentracao", ["periodo"])
    op.create_index("idx_conc_dia", "concentracao", ["day_date"])
    op.create_index("idx_conc_dia_periodo", "concentracao", ["day_date", "periodo"])
    op.create_index("idx_conc_ecgi_periodo", "concentracao", ["ecgi", "periodo"])


def downgrade() -> None:
    op.drop_index("idx_conc_ecgi_periodo", table_name="concentracao")
    op.drop_index("idx_conc_dia_periodo", table_name="concentracao")
    op.drop_index("idx_conc_dia", table_name="concentracao")
    op.drop_index("idx_conc_periodo", table_name="concentracao")
    op.drop_index("idx_conc_ecgi", table_name="concentracao")
    op.drop_table("concentracao")
