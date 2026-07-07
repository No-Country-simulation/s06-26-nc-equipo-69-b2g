"""Re-embed the documents from the Espectro project with nemotron and load into AppBit.

Pulls the TEXT (not the old vectors) from ESPECTRO_DATABASE_URL, generates new
embeddings with OpenRouter's free nemotron model, and inserts into the current
project's documents_vectors. Keeping a single embedding model is required so the
query-time embeddings live in the same vector space.

Env (.env): ESPECTRO_DATABASE_URL, DATABASE_URL, OPENROUTER_API_KEY
Run: .venv/Scripts/python.exe scripts/load_vectors_nemotron.py
"""
import json
import os
import urllib.error
import urllib.request

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(".env")

SRC = os.getenv("ESPECTRO_DATABASE_URL")
DST = os.getenv("DATABASE_URL")
KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("EMBED_MODEL", "nvidia/llama-nemotron-embed-vl-1b-v2:free")

if not (SRC and DST and KEY):
    raise SystemExit("Need ESPECTRO_DATABASE_URL, DATABASE_URL and OPENROUTER_API_KEY in .env")


def embed(text: str) -> list[float]:
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/embeddings",
        data=json.dumps({"model": MODEL, "input": text}).encode("utf-8"),
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"OpenRouter embed error {e.code}: {e.read().decode('utf-8')[:500]}")
    return payload["data"][0]["embedding"]


# --- pull text from source ---
src = psycopg2.connect(SRC.split("?")[0])
with src.cursor() as cur:
    cur.execute(
        "select fuente, seccion, contenido, metadata::text from documents_vectors order by id"
    )
    docs = cur.fetchall()
src.close()
print(f"Source docs: {len(docs)}")

# --- embed (probe dimension on the first one) ---
records = []
dim = None
for fuente, seccion, contenido, metadata in docs:
    vec = embed(f"{seccion}\n{contenido}")
    if dim is None:
        dim = len(vec)
        print(f"nemotron embedding dimension = {dim}")
    records.append((fuente, seccion, contenido, "[" + ",".join(map(str, vec)) + "]", metadata))

print(f"Embedded {len(records)} docs (dim={dim}).")
print(">>> If dim != 2048, alter the column to vector(%d) before inserting." % dim)

# --- insert into dest ---
dst = psycopg2.connect(DST.split("?")[0])
dst.set_session(readonly=False)
with dst.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        "insert into documents_vectors (fuente, seccion, contenido, embedding, metadata) values %s",
        records,
        template="(%s, %s, %s, %s::vector, %s::jsonb)",
    )
    cur.execute("select count(*) from documents_vectors")
    total = cur.fetchone()[0]
dst.commit()
dst.close()
print(f"Inserted. documents_vectors now has {total} rows.")
