# ETL Pipeline - App BiT

Este directorio contiene el pipeline ETL para la ingesta del dataset **Visent CDRView** en una base de datos SQLite (prueba) o Supabase/PostgreSQL (producción).

## Stack

| Herramienta | Propósito |
|-------------|-----------|
| **Python 3.11+** | Lenguaje principal |
| **Pandas** | Extracción y limpieza de CSVs |
| **SQLAlchemy 2.x** | ORM y conexión a base de datos |
| **Pydantic** | Validación de datos a nivel de fila |
| **Loguru** | Logging estructurado |
| **Typer** | CLI con tipado |
| **Alembic** | Migraciones de esquema |

## Datasets

| Archivo | Tabla | Filas | Contenido |
|---------|-------|-------|-----------|
| `data/antenas_flp.csv` | `antenas` | 132 | Catálogo de antenas (PK: ecgi) |
| `data/tensor_concentracao.csv` | `concentracao` | 7.920 | Concentración por antena/día/período |

## Modelo original (sin normalizar)

```mermaid
erDiagram
    antenas {
        text ecgi PK "Identificador de celda"
        varchar cluster "Nombre del cluster"
        varchar municipio "Municipio"
        float lat "Latitud"
        float lon "Longitud"
    }

    concentracao {
        int id PK "Auto-increment"
        text ecgi "FK lógica (sin constraint)"
        varchar cluster "Nombre del cluster"
        varchar municipio "Municipio"
        float lat "Latitud"
        float lon "Longitud"
        varchar day_date "Fecha YYYY-MM-DD"
        varchar periodo "MADRUGADA|MANHA|TARDE|NOITE"
        int n_usuarios "N\u00ba usuarios"
        int n_sessoes "N\u00ba sesiones"
        bigint download_bytes "Descarga (bytes)"
        bigint upload_bytes "Subida (bytes)"
        float dur_media_s "Duraci\u00f3n media (seg)"
        float drop_pct_medio "Drop rate"
        float congestionamento_medio "Congesti\u00f3n"
        int chamadas_total "Llamadas"
        int mensagens_total "Mensajes"
    }
```

> **Problema:** `cluster`, `municipio`, `lat` y `lon` están repetidos en ambas tablas, violando 2FN/3FN.

## Modelo normalizado (3FN)

```mermaid
erDiagram
    antenas {
        text ecgi PK "Identificador de celda"
        varchar cluster "Nombre del cluster"
        varchar municipio "Municipio"
        float lat "Latitud"
        float lon "Longitud"
    }

    concentracao {
        int id PK "Auto-increment"
        text ecgi FK "FK ~] antenas.ecgi"
        varchar day_date "Fecha YYYY-MM-DD"
        varchar periodo "MADRUGADA|MANHA|TARDE|NOITE"
        int n_usuarios "N\u00ba usuarios"
        int n_sessoes "N\u00ba sesiones"
        bigint download_bytes "Descarga (bytes)"
        bigint upload_bytes "Subida (bytes)"
        float dur_media_s "Duraci\u00f3n media (seg)"
        float drop_pct_medio "Drop rate"
        float congestionamento_medio "Congesti\u00f3n"
        int chamadas_total "Llamadas"
        int mensagens_total "Mensajes"
    }

    antenas ||--o{ concentracao : "tiene"
```

> **Nota:** `concentracao` tiene una constraint `UNIQUE(ecgi, day_date, periodo)` y una FK hacia `antenas.ecgi`. No se repite `cluster`, `municipio`, `lat` ni `lon`.

## Flujo de trabajo

### 1. Desarrollo local con SQLite

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar ETL contra SQLite (sin .env — usa defaults)
python scripts/run_etl.py --db sqlite

# Vista previa sin escribir
python scripts/run_etl.py --db sqlite --dry-run

# Forzar recarga (truncar + insertar)
python scripts/run_etl.py --db sqlite --force

# Correr tests
pytest tests/ -v
```

### 2. Producción con Supabase / PostgreSQL

```bash
# Configurar entorno
cp .env.example .env
```

Editar `.env`:
```
DB_TYPE=postgresql
DATABASE_URL=postgresql://project.user:password@aws-0-region.pooler.supabase.com:6543/postgres
```

```bash
# Ejecutar migraciones (lee DATABASE_URL del entorno automáticamente)
alembic upgrade head

# Ejecutar ETL
python scripts/run_etl.py --db postgresql
```

> **Nota:** `SSL_MODE=require` se agrega automáticamente si la URL no lo incluye. Para PostgreSQL local, setear `SSL_MODE=disable`.

## Tests

```bash
pytest tests/ -v
```

*Para más información sobre el proyecto, revisa el [README principal](../README.md).*
