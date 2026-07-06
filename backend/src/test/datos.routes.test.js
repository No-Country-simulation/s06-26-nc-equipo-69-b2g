import supertest from 'supertest';
import { vi } from 'vitest';

vi.mock('../ai/openrouter.service.js', () => ({
  callOpenRouter: vi.fn(),
}));
vi.mock('../ai/embeddings.service.js', () => ({
  embedText: vi.fn().mockResolvedValue(null),
}));

import { app } from '../app.js';
import { supabase } from '../lib/supabase.js';
import { callOpenRouter } from '../ai/openrouter.service.js';

const request = supertest(app);

function mockChain(result) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

describe('POST /api/v1/datos', () => {
  beforeEach(() => {
    supabase.from = vi.fn((table) => {
      if (table === 'riesgo_regiao') {
        return mockChain({
          data: [{ cluster: 'SANTO_AMARO' }, { cluster: 'CBD_BEIRAMAR' }],
          error: null,
        });
      }
      return mockChain({ data: [], error: null });
    });
  });

  it('returns clusters_destacados parsed from the agent response and strips the marker', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Zonas críticas identificadas.\n\nCLUSTERS_DESTACADOS: ["SANTO_AMARO"]',
    });

    const res = await request.post('/api/v1/datos').send({ prompt: 'zonas sin cobertura' });

    expect(res.status).toBe(200);
    expect(res.body.respuesta_ia).toBe('Zonas críticas identificadas.');
    expect(res.body.clusters_destacados).toEqual(['SANTO_AMARO']);
  });

  it('filters out clusters that do not exist in riesgo_regiao', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Análisis.\nCLUSTERS_DESTACADOS: ["SANTO_AMARO", "CLUSTER_INVENTADO"]',
    });

    const res = await request.post('/api/v1/datos').send({ prompt: 'riesgo alto' });

    expect(res.status).toBe(200);
    expect(res.body.clusters_destacados).toEqual(['SANTO_AMARO']);
  });

  it('returns an empty array when the agent highlights nothing', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Respuesta sin marcador.',
    });

    const res = await request.post('/api/v1/datos').send({ prompt: 'hola' });

    expect(res.status).toBe(200);
    expect(res.body.clusters_destacados).toEqual([]);
    expect(res.body.respuesta_ia).toBe('Respuesta sin marcador.');
  });

  it('surfaces the provider error instead of a silent fallback when the model fails', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockRejectedValue(new Error('provider 500'));

    const res = await request.post('/api/v1/datos').send({ prompt: 'priorizar politica' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('provider 500');
  });

  it('still validates that prompt is required', async () => {
    const res = await request.post('/api/v1/datos').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/datos — antenna and demographic context', () => {
  it('filters tensor_concentracao by ecgi when provided', async () => {
    const chains = {};
    supabase.from = vi.fn((table) => {
      chains[table] = mockChain({ data: [], error: null });
      return chains[table];
    });
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request
      .post('/api/v1/datos')
      .send({ prompt: 'como esta esta antena', ecgi: '7240501005373318' });

    expect(res.status).toBe(200);
    expect(chains.tensor_concentracao.eq).toHaveBeenCalledWith('ecgi', '7240501005373318');
  });

  it('filters zone tables with regions[] and asks the model to compare all selected zones', async () => {
    const chains = {};
    supabase.from = vi.fn((table) => {
      chains[table] = mockChain({
        data:
          table === 'riesgo_regiao'
            ? [{ cluster: 'SANTO_AMARO' }, { cluster: 'CBD_BEIRAMAR' }]
            : [],
        error: null,
      });
      return chains[table];
    });
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request
      .post('/api/v1/datos')
      .send({ prompt: 'comparar zonas', regions: ['SANTO_AMARO', 'CBD_BEIRAMAR'] });

    expect(res.status).toBe(200);
    expect(chains.riesgo_regiao.in).toHaveBeenCalledWith('cluster', [
      'SANTO_AMARO',
      'CBD_BEIRAMAR',
    ]);
    expect(chains.tensor_concentracao.in).toHaveBeenCalledWith('cluster', [
      'SANTO_AMARO',
      'CBD_BEIRAMAR',
    ]);
    expect(chains.antenas_flp.in).toHaveBeenCalledWith('cluster', ['SANTO_AMARO', 'CBD_BEIRAMAR']);
    const userMessage = callOpenRouter.mock.lastCall[0];
    expect(userMessage).toContain('SANTO_AMARO');
    expect(userMessage).toContain('CBD_BEIRAMAR');
    expect(userMessage).toContain('compará explícitamente todas las zonas seleccionadas');
  });

  it('injects the demographic profile into the LLM context when region is set', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({
      data: [
        {
          cluster: 'SANTO_AMARO',
          n_assinantes: 3236,
          income: { A: 100, B: 400, C: 1200, D: 1536 },
          age_groups: { '18-24': 500 },
          mobility: { BAIXA: 1000 },
          pct_flagship: 0.12,
        },
      ],
      error: null,
    });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request
      .post('/api/v1/datos')
      .send({ prompt: 'que necesita esta zona', region: 'SANTO_AMARO' });

    expect(res.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('mapa_demografia', { p_cluster: 'SANTO_AMARO' });
    const userMessage = callOpenRouter.mock.lastCall[0];
    expect(userMessage).toContain('Perfil demográfico');
    expect(userMessage).toContain('3236');
  });

  it('injects nearby public services context when equipamentos_publicos returns services', async () => {
    supabase.from = vi.fn((table) => {
      if (table === 'riesgo_regiao') {
        return mockChain({
          data: [{ cluster: 'SANTO_AMARO', lat: -27.6, lon: -48.55 }],
          error: null,
        });
      }
      if (table === 'equipamentos_publicos') {
        return mockChain({
          data: [
            {
              nome: 'Unidade de Saúde Santo Amaro',
              tipo: 'clinic',
              categoria: 'salud',
              lat: -27.601,
              lon: -48.551,
            },
          ],
          error: null,
        });
      }
      return mockChain({ data: [], error: null });
    });
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request
      .post('/api/v1/datos')
      .send({ prompt: 'que politica priorizar', region: 'SANTO_AMARO' });

    expect(res.status).toBe(200);
    const userMessage = callOpenRouter.mock.lastCall[0];
    expect(userMessage).toContain('Servicios públicos cercanos');
    expect(userMessage).toContain('Unidade de Saúde Santo Amaro');
    expect(res.body.datos_extra.equipamentos_publicos).toBe(1);
    expect(res.body.fuentes).toContain('equipamentos_publicos');
  });

  it('does not fail when equipamentos_publicos query errors', async () => {
    supabase.from = vi.fn((table) => {
      if (table === 'riesgo_regiao') {
        return mockChain({
          data: [{ cluster: 'SANTO_AMARO', lat: -27.6, lon: -48.55 }],
          error: null,
        });
      }
      if (table === 'equipamentos_publicos') {
        return mockChain({ data: null, error: { message: 'relation does not exist' } });
      }
      return mockChain({ data: [], error: null });
    });
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request
      .post('/api/v1/datos')
      .send({ prompt: 'panorama', region: 'SANTO_AMARO' });

    expect(res.status).toBe(200);
    expect(res.body.datos_extra.equipamentos_publicos).toBe(0);
    expect(res.body.fuentes).not.toContain('equipamentos_publicos');
  });

  it('does not call the demografia RPC when region is absent', async () => {
    supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    callOpenRouter.mockResolvedValue({ role: 'assistant', content: 'ok' });

    const res = await request.post('/api/v1/datos').send({ prompt: 'panorama general' });

    expect(res.status).toBe(200);
    expect(supabase.rpc).not.toHaveBeenCalledWith('mapa_demografia', expect.anything());
  });
});
