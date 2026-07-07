import {
  clustersToGeoJson,
  concentracaoToGeoJson,
  equipamentosToGeoJson,
  odToGeoJson,
  demografiaToResponse,
} from '../modules/mapa/mapa.transformers.js';

describe('clustersToGeoJson', () => {
  const row = {
    cluster: 'SANTO_AMARO',
    municipio: 'Santo Amaro',
    lat: -27.71,
    lon: -48.78,
    score_riesgo: 0.895,
    infra: 1.0,
    concentracion: 1.0,
    vulnerabilidad: 0.652,
    n_usuarios_total: 3236,
    pct_legacy_tech: 0.0,
    pct_renta_baja: 0.652,
    congestion_media: 0.0,
    nivel_riesgo: 'ALTO',
    sin_cobertura: true,
    updated_at: '2026-06-16T18:20:59.000Z',
  };

  it('builds a FeatureCollection of Point features in [lon, lat] order', () => {
    const fc = clustersToGeoJson([row]);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(1);
    const feature = fc.features[0];
    expect(feature.type).toBe('Feature');
    expect(feature.geometry).toEqual({ type: 'Point', coordinates: [-48.78, -27.71] });
  });

  it('exposes risk properties without lat/lon/updated_at', () => {
    const { properties } = clustersToGeoJson([row]).features[0];
    expect(properties).toEqual({
      cluster: 'SANTO_AMARO',
      municipio: 'Santo Amaro',
      nivel_riesgo: 'ALTO',
      score_riesgo: 0.895,
      infra: 1.0,
      concentracion: 1.0,
      vulnerabilidad: 0.652,
      n_usuarios_total: 3236,
      pct_legacy_tech: 0.0,
      pct_renta_baja: 0.652,
      congestion_media: 0.0,
      sin_cobertura: true,
    });
    expect(properties.lat).toBeUndefined();
    expect(properties.lon).toBeUndefined();
    expect(properties.updated_at).toBeUndefined();
  });

  it('returns an empty FeatureCollection for empty input', () => {
    expect(clustersToGeoJson([])).toEqual({ type: 'FeatureCollection', features: [] });
  });
});

describe('concentracaoToGeoJson', () => {
  const row = {
    ecgi: '7240501005373318',
    cluster: 'CENTRO_HISTORICO',
    municipio: 'Florianopolis',
    periodo: 'MANHA',
    lat: -27.60395,
    lon: -48.546242,
    n_usuarios: 62834,
    congestion_media: 0.35,
    drop_pct_media: 0.069,
  };

  it('builds Point features with metadata.periodo', () => {
    const fc = concentracaoToGeoJson([row], 'MANHA');
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.metadata).toEqual({ periodo: 'MANHA' });
    const feature = fc.features[0];
    expect(feature.geometry).toEqual({ type: 'Point', coordinates: [-48.546242, -27.60395] });
    expect(feature.properties).toEqual({
      ecgi: '7240501005373318',
      cluster: 'CENTRO_HISTORICO',
      municipio: 'Florianopolis',
      periodo: 'MANHA',
      n_usuarios: 62834,
      congestion_media: 0.35,
      drop_pct_media: 0.069,
    });
  });
});

describe('equipamentosToGeoJson', () => {
  const row = {
    nome: 'Hospital Regional',
    tipo: 'hospital',
    categoria: 'salud',
    source: 'osm',
    source_id: 'node/123',
    lat: -27.591,
    lon: -48.552,
    tags: { amenity: 'hospital' },
  };

  it('builds public facility Point features in [lon, lat] order', () => {
    const fc = equipamentosToGeoJson([row]);

    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features[0].geometry).toEqual({ type: 'Point', coordinates: [-48.552, -27.591] });
  });

  it('exposes only map-safe facility properties', () => {
    const { properties } = equipamentosToGeoJson([row]).features[0];

    expect(properties).toEqual({
      nome: 'Hospital Regional',
      tipo: 'hospital',
      categoria: 'salud',
      source: 'osm',
      source_id: 'node/123',
    });
    expect(properties.tags).toBeUndefined();
  });
});

describe('odToGeoJson', () => {
  const row = {
    cluster_origem: 'ESTREITO_CAPOEIRAS',
    municipio_origem: 'Florianópolis',
    lat_origem: -27.588,
    lon_origem: -48.585,
    cluster_destino: 'CBD_BEIRAMAR',
    municipio_destino: 'Florianópolis',
    lat_destino: -27.5954,
    lon_destino: -48.548,
    n_usuarios: 24705,
    n_viagens: 28288,
    dist_media_km: 3.74,
    periodo_predominante: 'NOITE',
  };

  it('builds LineString features from origin to destination in [lon, lat] order', () => {
    const fc = odToGeoJson([row]);
    const feature = fc.features[0];
    expect(feature.geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [-48.585, -27.588],
        [-48.548, -27.5954],
      ],
    });
    expect(feature.properties).toEqual({
      cluster_origem: 'ESTREITO_CAPOEIRAS',
      cluster_destino: 'CBD_BEIRAMAR',
      municipio_origem: 'Florianópolis',
      municipio_destino: 'Florianópolis',
      n_usuarios: 24705,
      n_viagens: 28288,
      dist_media_km: 3.74,
      periodo_predominante: 'NOITE',
    });
  });
});

describe('demografiaToResponse', () => {
  const rows = [
    {
      cluster: 'SANTO_AMARO',
      n_assinantes: 3236,
      income: { A: 100, B: 400, C: 1200, D: 1536 },
      age_groups: { '18-24': 500, '25-34': 900, '35-44': 800, '45-54': 600, '55+': 436 },
      mobility: { BAIXA: 1000, MODERADA: 1500, INTENSA: 736 },
      pct_flagship: 0.12,
    },
    {
      cluster: 'CBD_BEIRAMAR',
      n_assinantes: 10000,
      income: { A: 4000, B: 3000, C: 2000, D: 1000 },
      age_groups: { '18-24': 2000, '25-34': 3000, '35-44': 2500, '45-54': 1500, '55+': 1000 },
      mobility: { BAIXA: 2000, MODERADA: 4000, INTENSA: 4000 },
      pct_flagship: 0.55,
    },
  ];

  it('keys profiles by cluster for O(1) lookup on map click', () => {
    const result = demografiaToResponse(rows);
    expect(result.clusters.SANTO_AMARO.n_assinantes).toBe(3236);
    expect(result.clusters.SANTO_AMARO.income).toEqual({ A: 100, B: 400, C: 1200, D: 1536 });
    expect(result.clusters.CBD_BEIRAMAR.pct_flagship).toBe(0.55);
    expect(result.clusters.SANTO_AMARO.cluster).toBeUndefined();
  });

  it('computes metadata totals', () => {
    const result = demografiaToResponse(rows);
    expect(result.metadata).toEqual({ total_assinantes: 13236, n_clusters: 2 });
  });

  it('handles empty input', () => {
    expect(demografiaToResponse([])).toEqual({
      metadata: { total_assinantes: 0, n_clusters: 0 },
      clusters: {},
    });
  });
});
