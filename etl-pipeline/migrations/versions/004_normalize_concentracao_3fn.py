"""normalize concentracao (3FN)

Revision ID: 004
Revises: 003
Create Date: 2026-06-22 10:51:40.197933
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FK_NAME = "fk_concentracao_antenas"
UQ_NAME = "uq_conc_ecgi_dia_periodo"


def upgrade() -> None:
    op.execute(
        "DELETE FROM concentracao WHERE id NOT IN ("
        "  SELECT MIN(id) FROM concentracao"
        "  GROUP BY ecgi, day_date, periodo"
        ")"
    )
    with op.batch_alter_table("concentracao") as batch_op:
        batch_op.create_unique_constraint(UQ_NAME, ["ecgi", "day_date", "periodo"])
        batch_op.create_foreign_key(FK_NAME, "antenas", ["ecgi"], ["ecgi"])
        batch_op.drop_column("cluster")
        batch_op.drop_column("municipio")
        batch_op.drop_column("lat")
        batch_op.drop_column("lon")


def downgrade() -> None:
    with op.batch_alter_table("concentracao") as batch_op:
        batch_op.add_column(sa.Column("cluster", sa.VARCHAR(length=40), nullable=False))
        batch_op.add_column(sa.Column("municipio", sa.VARCHAR(length=60), nullable=False))
        batch_op.add_column(sa.Column("lat", sa.FLOAT(), nullable=False))
        batch_op.add_column(sa.Column("lon", sa.FLOAT(), nullable=False))
        batch_op.drop_constraint(FK_NAME, type_="foreignkey")
        batch_op.drop_constraint(UQ_NAME, type_="unique")
