"""Diagnose Supabase connection without leaking the password.

Run: .venv/Scripts/python.exe scripts/diag_conn.py
"""
import os
from urllib.parse import quote, urlsplit

import psycopg2
from dotenv import load_dotenv

load_dotenv(".env")

raw = os.getenv("DIRECT_URL") or os.getenv("DATABASE_URL")
print("Using:", "DIRECT_URL" if os.getenv("DIRECT_URL") else "DATABASE_URL")

parts = urlsplit(raw)
print("scheme :", parts.scheme)
print("host   :", parts.hostname)
print("port   :", parts.port)
print("user   :", parts.username)          # MUST be postgres.<ref>
print("pw set :", bool(parts.password))
print("pw len :", len(parts.password or ""))
# show which chars in pw need URL-encoding
special = [c for c in (parts.password or "") if c in "@#/:?%&= "]
print("pw special chars needing encode:", special)

# Attempt 1: connect using parsed kwargs (bypasses DSN re-parsing ambiguity)
print("\n--- Attempt: keyword-arg connect ---")
try:
    conn = psycopg2.connect(
        host=parts.hostname,
        port=parts.port,
        user=parts.username,
        password=parts.password,
        dbname=parts.path.lstrip("/") or "postgres",
        sslmode="require",
    )
    print("OK connected via kwargs")
    conn.close()
except Exception as e:  # noqa: BLE001
    print("FAILED:", e)
