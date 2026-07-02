import supertest from 'supertest';
import { vi } from 'vitest';
import { app } from '../app.js';
import { supabase } from '../lib/supabase.js';

const request = supertest(app);

function mockSelectChain(result) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
    then: (resolve) => resolve(result),
  };
}

const clusterRow = {
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

describe('GET /api/v1/mapa/clusters', () => {
  it('returns a GeoJSON FeatureCollection with cluster properties', async () => {
    supabase.from = vi.fn().mockReturnValue(mockSelectChain({ data: [clusterRow], error: null }));

    const res = await request.get('/api/v1/mapa/clusters');

    expect(res.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith('riesgo_regiao');
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features[0].geometry).toEqual({
      type: 'Point',
      coordinates: [-48.78, -27.71],
    });
    expect(res.body.features[0].properties.cluster).toBe('SANTO_AMARO');
    expect(res.body.features[0].properties.nivel_riesgo).toBe('ALTO');
  });
});

describe('GET /api/v1/mapa/concentracao', () => {
  const concentracaoRow = {
    ecgi: '7240501005373318',
    cluster: 'CENTRO_HISTORICO',
    municipio: 'Florianopolis',
    periodo: 'TARDE',
    lat: -27.60395,
    lon: -48.546242,
    n_usuarios: 62834,
    congestion_media: 0.35,
    drop_pct_media: 0.069,
  };

  it('calls the aggregation RPC with the requested periodo', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({ data: [concentracaoRow], error: null });

    const res = await request.get('/api/v1/mapa/concentracao?periodo=TARDE');

    expect(res.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('mapa_concentracao', { p_periodo: 'TARDE' });
    expect(res.body.metadata).toEqual({ periodo: 'TARDE' });
    expect(res.body.features[0].properties.n_usuarios).toBe(62834);
  });

  it('defaults periodo to MANHA when omitted', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });

    const res = await request.get('/api/v1/mapa/concentracao');

    expect(res.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('mapa_concentracao', { p_periodo: 'MANHA' });
    expect(res.body.metadata).toEqual({ periodo: 'MANHA' });
  });

  it('rejects invalid periodo values with 400', async () => {
    supabase.rpc = vi.fn();

    const res = await request.get('/api/v1/mapa/concentracao?periodo=SIESTA');

    expect(res.status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/mapa/od', () => {
  it('returns LineString features filtered to inter-cluster flows', async () => {
    const odRow = {
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
    const chain = mockSelectChain({ data: [odRow], error: null });
    supabase.from = vi.fn().mockReturnValue(chain);

    const res = await request.get('/api/v1/mapa/od');

    expect(res.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith('tensor_od');
    expect(chain.eq).toHaveBeenCalledWith('mesmo_cluster', 0);
    expect(chain.order).toHaveBeenCalledWith('n_viagens', { ascending: false });
    expect(res.body.features[0].geometry.type).toBe('LineString');
    expect(res.body.features[0].properties.n_viagens).toBe(28288);
  });
});
