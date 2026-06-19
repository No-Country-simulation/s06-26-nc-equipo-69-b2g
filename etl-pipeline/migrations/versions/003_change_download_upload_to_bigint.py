"""change download_bytes and upload_bytes to BigInteger

Revision ID: 003
Revises: 002
Create Date: 2026-06-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("concentracao", "download_bytes", type_=sa.BigInteger(), postgresql_using="download_bytes::bigint")
    op.alter_column("concentracao", "upload_bytes", type_=sa.BigInteger(), postgresql_using="upload_bytes::bigint")


def downgrade() -> None:
    op.alter_column("concentracao", "download_bytes", type_=sa.Integer(), postgresql_using="download_bytes::integer")
    op.alter_column("concentracao", "upload_bytes", type_=sa.Integer(), postgresql_using="upload_bytes::integer")
