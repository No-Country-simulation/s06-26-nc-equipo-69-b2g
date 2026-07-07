# Integración frontend ↔ backend: mapa + chat IA

Guía para conectar el mapa de Mapbox y el chat con los endpoints del backend. Cubre los contratos, el flujo de producto (mapa → chat y chat → mapa) y el flujo de usuario paso a paso. Referencia interactiva de los contratos: `/api-docs` (Swagger).

Base URL: `{API_URL}/api/v1` · Viewport inicial sugerido: `center: [-48.6, -27.5]`, `zoom: 9`.

## Camino rápido

1. Al montar el mapa, hacer 3 fetch en paralelo: `GET /mapa/clusters`, `GET /mapa/concentracao` y `GET /mapa/demografia`. Cachear demografía en memoria.
2. Pintar capas: clusters como `circle`, concentración como `heatmap` (los mismos puntos sirven como marcadores de antena clickeables).
3. Cargar `GET /mapa/od` como capa `line` (puede ser lazy, al activar el toggle de flujos).
4. Click en cluster → popup con demografía cacheada + abrir chat con `region`.
5. Respuesta del chat trae `clusters_destacados` → resaltar esos features en el mapa.

## Endpoints

| Endpoint                          | Capa / uso                          | Payload                      | Cuándo llamarlo                |
| --------------------------------- | ----------------------------------- | ---------------------------- | ------------------------------ |
| `GET /mapa/clusters`              | `circle` — capa principal de riesgo | 27 features Point            | Al montar el mapa              |
| `GET /mapa/concentracao?periodo=` | `heatmap` + marcadores de antena    | 132 features Point           | Al montar y al cambiar período |
| `GET /mapa/od`                    | `line` — flujos entre clusters      | ~506 features LineString     | Al activar la capa de flujos   |
| `GET /mapa/demografia`            | Popup/panel (no es capa visual)     | 27 perfiles keyed by cluster | Una vez, cachear               |
| `POST /datos`                     | Chat IA                             | JSON                         | En cada consulta del usuario   |

Todos los `/mapa/*` devuelven GeoJSON `FeatureCollection` con coordenadas en orden Mapbox `[lon, lat]`, listos para usar como `source` sin transformación.

### Propiedades clave por capa

| Capa         | Propiedad                            | Uso visual                                   |
| ------------ | ------------------------------------ | -------------------------------------------- |
| clusters     | `nivel_riesgo`                       | Color: ALTO=rojo, MEDIO=amarillo, BAJO=verde |
| clusters     | `score_riesgo` (0–1)                 | Tamaño de burbuja                            |
| clusters     | `sin_cobertura`                      | Badge/ícono de zona sin red                  |
| clusters     | `cluster`                            | Identificador → `region` en el chat          |
| concentracao | `n_usuarios`                         | Peso del heatmap                             |
| concentracao | `congestion_media`, `drop_pct_media` | Tooltip de calidad de red al hover           |
| concentracao | `ecgi`                               | Identificador de antena → `ecgi` en el chat  |
| od           | `n_viagens`                          | Grosor de línea                              |
| od           | `periodo_predominante`               | Color o filtro                               |

`periodo` acepta `MADRUGADA | MANHA | TARDE | NOITE` (default `MANHA`); un valor inválido devuelve `400`.

## Flujo de producto

### Flujo A — mapa → chat (el mapa es el selector de contexto)

```
Usuario hace click en un feature del mapa
  ├─ cluster (capa circle)
  │    → popup: propiedades de riesgo + demografia.clusters[properties.cluster]
  │    → abrir chat con region = properties.cluster
  │    → POST /datos { prompt, region: "SANTO_AMARO" }
  │         backend filtra riesgo/red/antenas por ese cluster
  │         e inyecta su perfil demográfico al contexto de la IA
  │
  └─ antena (puntos de la capa concentracao)
       → tooltip: n_usuarios, congestion_media, drop_pct_media
       → abrir chat con ecgi = properties.ecgi
       → POST /datos { prompt, ecgi: "7240501005373318" }
            backend filtra tensor_concentracao por esa antena
            (ecgi tiene prioridad sobre region para datos de red)
```

### Flujo B — chat → mapa (la IA resalta regiones)

```
POST /datos { prompt: "zonas con alta concentración y sin cobertura" }
  → respuesta:
     {
       "respuesta_ia": "...",                        ← texto limpio, máx ~120 palabras
       "clusters_destacados": ["SANTO_AMARO", ...],  ← validados contra riesgo_regiao
       "datos_extra": { ... },
       "fuentes": [ ... ]
     }
  → frontend resalta esos features en la capa clusters
    (ej. setFeatureState / filtro de opacidad sobre properties.cluster)
```

`clusters_destacados` puede venir vacío (`[]`) — significa que la IA no destacó ninguna región; no romper el resaltado, solo limpiarlo. Los nombres ya vienen validados: nunca llega un cluster que no exista en la capa.

## Flujo de usuario (journey del gestor público)

1. **Entra al dashboard** → mapa centrado en la región metropolitana de Florianópolis con las burbujas de riesgo visibles. Lee el mapa de un vistazo: rojo = zona crítica.
2. **Explora** → hover sobre antenas muestra calidad de red; toggle de heatmap por período del día; toggle de flujos muestra corredores de movilidad (de dónde a dónde se mueve la gente).
3. **Se enfoca** → click en un cluster rojo. Popup: score de riesgo, cobertura, y perfil de quién vive ahí (renta, edad, movilidad). El chat se abre pre-contextualizado a esa zona.
4. **Pregunta** → "¿qué programa social necesita esta zona?". La IA responde corto y accionable (hallazgo + sugerencia estratégica) usando riesgo + red + demografía de ese cluster.
5. **Descubre** → pregunta abierta sin seleccionar zona ("¿dónde hay alta concentración sin cobertura?"). La IA responde y el mapa resalta los clusters mencionados → vuelve al paso 3 sobre uno de ellos.

El ciclo 3→4→5 es el core del producto: mapa y chat se retroalimentan.

## Contratos de referencia

### `POST /datos` — request

```json
{
  "prompt": "¿qué necesita esta zona?", // requerido
  "region": "SANTO_AMARO", // opcional — click en cluster
  "ecgi": "7240501005373318", // opcional — click en antena
  "language": "es" // opcional, default es
}
```

### `GET /mapa/demografia` — response (fragmento)

```json
{
  "metadata": { "total_assinantes": 200000, "n_clusters": 27 },
  "clusters": {
    "SANTO_AMARO": {
      "n_assinantes": 3236,
      "income": { "A": 247, "B": 880, "C": 1425, "D": 684 },
      "age_groups": {
        "18-24": 642,
        "25-34": 646,
        "35-44": 672,
        "45-54": 671,
        "55+": 605
      },
      "mobility": { "BAIXA": 1142, "MODERADA": 1435, "INTENSA": 659 },
      "pct_flagship": 0.1706
    }
  }
}
```

Lookup en el click: `demografia.clusters[feature.properties.cluster]` — O(1), sin fetch extra. Lectura del dato: renta C+D alta = población vulnerable; `pct_flagship` bajo = proxy de menor poder adquisitivo.

### Configs Mapbox sugeridas

```js
// Heatmap de concentración
map.addLayer({
  id: "heatmap-concentracao",
  type: "heatmap",
  source: "concentracao",
  paint: {
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["get", "n_usuarios"],
      0,
      0,
      62834,
      1,
    ],
    "heatmap-radius": 30,
  },
});

// Flujos OD
map.addLayer({
  id: "flujos-od",
  type: "line",
  source: "od",
  paint: {
    "line-width": [
      "interpolate",
      ["linear"],
      ["get", "n_viagens"],
      0,
      1,
      28288,
      8,
    ],
    "line-color": "#00bcd4",
    "line-opacity": 0.6,
  },
});
```

## Checklist de integración

- [ ] Las 4 fuentes GeoJSON cargan sin transformación (`type: 'geojson'`, `data: <respuesta>`)
- [ ] Click en cluster abre popup con demografía cacheada y setea `region` en el chat
- [ ] Click en antena setea `ecgi` en el chat
- [ ] Cambio de período re-fetchea `/mapa/concentracao?periodo=`
- [ ] `clusters_destacados` de cada respuesta del chat actualiza (o limpia) el resaltado
- [ ] `POST /datos` sin `prompt` → manejar `400`

## Qué NO hacer

| Anti-patrón                                                                      | Por qué                                                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Pedir `assinantes`, `tensor_mobilidade` o `tensor_sequencias` directo a Supabase | Datos individuales / demasiado grandes — el backend solo expone agregados           |
| Re-fetchear demografía en cada click                                             | Es estática: un fetch, cachear                                                      |
| Construir un endpoint de "antenas" aparte                                        | Los puntos de `/mapa/concentracao` SON las antenas (posición fija, `ecgi` incluido) |
| Mostrar la línea `CLUSTERS_DESTACADOS` al usuario                                | El backend ya la elimina de `respuesta_ia`; si aparece, es un bug — reportarlo      |
