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

  it('still validates that prompt is required', async () => {
    const res = await request.post('/api/v1/datos').send({});
    expect(res.status).toBe(400);
  });
});
