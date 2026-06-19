"""create antenas table

Revision ID: 002
Revises: 001
Create Date: 2026-06-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "antenas",
        sa.Column("ecgi", sa.Text(), nullable=False),
        sa.Column("cluster", sa.String(40), nullable=False),
        sa.Column("municipio", sa.String(60), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("ecgi"),
    )


def downgrade() -> None:
    op.drop_table("antenas")
