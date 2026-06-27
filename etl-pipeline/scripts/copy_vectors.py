"""Copy documents_vectors rows from a source Supabase project to the destination.

Source  = ESPECTRO_DATABASE_URL (project Espectro, where the embeddings already exist)
Dest    = DATABASE_URL          (current AppBit project)

Both should be the transaction pooler URL (port 6543). Run:
    .venv/Scripts/python.exe scripts/copy_vectors.py
"""
import os

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(".env")

SRC = os.getenv("ESPECTRO_DATABASE_URL")
DST = os.getenv("DATABASE_URL")
if not SRC or not DST:
    raise SystemExit("Need ESPECTRO_DATABASE_URL (source) and DATABASE_URL (dest) in .env")


def strip_pgbouncer(url: str) -> str:
    return url.split("?")[0]


# --- read from source ---
src = psycopg2.connect(strip_pgbouncer(SRC))
with src.cursor() as cur:
    cur.execute(
        "select fuente, seccion, contenido, embedding::text, metadata::text "
        "from documents_vectors order by id"
    )
    rows = cur.fetchall()
src.close()
print(f"Source rows: {len(rows)}")
if not rows:
    raise SystemExit("No rows in source documents_vectors")

# --- write to dest ---
dst = psycopg2.connect(strip_pgbouncer(DST))
dst.set_session(readonly=False)  # in case the project is in read-only mode
with dst.cursor() as cur:
    cur.execute("select count(*) from documents_vectors")
    before = cur.fetchone()[0]
    psycopg2.extras.execute_values(
        cur,
        "insert into documents_vectors (fuente, seccion, contenido, embedding, metadata) "
        "values %s",
        rows,
        template="(%s, %s, %s, %s::vector, %s::jsonb)",
    )
    cur.execute("select count(*) from documents_vectors")
    after = cur.fetchone()[0]
dst.commit()
dst.close()
print(f"Dest documents_vectors: {before} -> {after}  (inserted {after - before})")
