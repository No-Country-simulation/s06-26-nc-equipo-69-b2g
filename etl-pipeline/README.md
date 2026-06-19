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
