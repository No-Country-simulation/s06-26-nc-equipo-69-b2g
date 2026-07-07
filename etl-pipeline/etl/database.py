import psycopg2
import psycopg2.extras


def get_connection(database_url: str):
    conn = psycopg2.connect(database_url)
    # Supabase free-tier sets default_transaction_read_only=on when the project
    # is over its disk quota. Override per session so the (capped) ETL can write;
    # this is a USERSET param and the server is not in recovery, so it is allowed.
    # No-op when the project is not in read-only mode.
    conn.set_session(readonly=False)
    return conn


def truncate_and_bulk_insert(
    conn,
    table: str,
    columns: list[str],
    rows: list[tuple],
    *,
    cascade: bool = False,
) -> int:
    cols_sql = ", ".join(columns)
    cascade_sql = " CASCADE" if cascade else ""
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE TABLE {table}{cascade_sql}")
        if rows:
            psycopg2.extras.execute_values(
                cur,
                f"INSERT INTO {table} ({cols_sql}) VALUES %s",
                rows,
            )
    conn.commit()
    return len(rows)


def truncate_table(conn, table: str, *, cascade: bool = False) -> None:
    cascade_sql = " CASCADE" if cascade else ""
    with conn.cursor() as cur:
        cur.execute(f"TRUNCATE TABLE {table}{cascade_sql}")
    conn.commit()


def bulk_insert_rows(
    conn,
    table: str,
    columns: list[str],
    rows: list[tuple],
    *,
    page_size: int = 10_000,
) -> int:
    if not rows:
        return 0

    cols_sql = ", ".join(columns)
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            f"INSERT INTO {table} ({cols_sql}) VALUES %s",
            rows,
            page_size=page_size,
        )
    conn.commit()
    return len(rows)


def upsert_riesgo_regiao(conn, rows: list[dict]) -> int:
    columns = [
        "cluster",
        "municipio",
        "lat",
        "lon",
        "score_riesgo",
        "infra",
        "concentracion",
        "vulnerabilidad",
        "n_usuarios_total",
        "pct_legacy_tech",
        "pct_renta_baja",
        "congestion_media",
        "nivel_riesgo",
        "sin_cobertura",
    ]
    values = [tuple(row[col] for col in columns) for row in rows]
    update_cols = [column for column in columns if column != "cluster"]
    set_clause = ", ".join(f"{column} = EXCLUDED.{column}" for column in update_cols)
    set_clause += ", updated_at = now()"

    sql = (
        f"INSERT INTO riesgo_regiao ({', '.join(columns)}) VALUES %s "
        f"ON CONFLICT (cluster) DO UPDATE SET {set_clause}"
    )
    with conn.cursor() as cur:
        if values:
            psycopg2.extras.execute_values(cur, sql, values)
    conn.commit()
    return len(values)


def count_rows(conn, table: str) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]
