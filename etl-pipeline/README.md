# CDRView Data Pipeline

Pipeline Python standalone para ingestar el dataset CDRView en Supabase/Postgres y calcular el riesgo de exclusion digital por cluster en `riesgo_regiao`.

Este slice cubre ingesta y scoring. RAG/pgvector, OpenRouter y endpoints Express quedan fuera de este directorio.

## Database schema

El schema se gestiona con migraciones SQL de Supabase en `../supabase/migrations/`.
Alembic fue removido de `etl-pipeline`; no hay flujo de migraciones Python para este slice.

Aplica las migraciones Supabase antes de ejecutar el pipeline para crear estas tablas target:

```text
clusters
antenas_flp
assinantes
tensor_concentracao
tensor_fluxo_vias
tensor_mobilidade
tensor_od
tensor_sequencias
tensor_tempo_deslocamento
riesgo_regiao
documents_vectors
```

La carga recarga las tablas CSV target con `TRUNCATE` sin `CASCADE`. Es intencional: esas tablas son hijas de `clusters` y no se truncan tablas padre ni tablas publicadas como `riesgo_regiao`. Si en el futuro otra tabla referencia estos targets, hay que ajustar el orden de carga o habilitar `cascade=True` de forma explicita para esa llamada, sabiendo que tambien borraria datos dependientes.

## Setup

```bash
cd etl-pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copia `.env.example` a `.env` y completa una conexion Postgres server-side. `DIRECT_URL` es preferible para carga batch; si no existe, se usa `DATABASE_URL`.

## Dataset

Los CSV no van commiteados. Colocalos en el directorio indicado por `CDRVIEW_DATA_DIR` (default `./data`):

```text
etl-pipeline/data/
  referencias/
    antenas_flp.csv
    assinantes.csv
    clusters.csv            # opcional si la tabla clusters ya esta seeded
  tensores/
    tensor_concentracao.csv
    tensor_fluxo_vias.csv
    tensor_mobilidade.csv
    tensor_od.csv
    tensor_sequencias.csv
    tensor_tempo_deslocamento.csv
```

`tensor_mobilidade.csv` y `tensor_sequencias.csv` pueden pesar varios GB. El pipeline los procesa en chunks para insertarlos en Postgres; no los carga completos en memoria. Durante la carga de `tensor_mobilidade.csv`, el mismo scan acumula `pct_legacy_tech` por cluster para evitar leer el archivo una segunda vez en el scoring.

## Uso

```bash
python scripts/run_etl.py
```

Orden de ejecucion:

1. Hace upsert de `clusters.csv` si existe; si no existe, valida que `clusters` ya tenga datos.
2. Recarga referencias y tensores con truncate + bulk insert por chunks.
3. Acumula `pct_legacy_tech` por cluster durante la carga chunked de `tensor_mobilidade`.
4. Calcula `infra`, `concentracion`, `vulnerabilidad`, `score_riesgo`, `nivel_riesgo` y `sin_cobertura`.
5. Hace upsert en `riesgo_regiao` por `cluster`.

## Tests

```bash
pytest tests/ -v
```

Los tests actuales son unitarios y no requieren DB real ni dataset completo.
