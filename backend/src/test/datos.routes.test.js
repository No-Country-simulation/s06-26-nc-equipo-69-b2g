import supertest from 'supertest';
import { vi } from 'vitest';

vi.mock('../ai/openrouter.service.js', () => ({
  callOpenRouter: vi.fn(),
}));
vi.mock('../ai/embeddings.service.js', () => ({
  embedText: vi.fn().mockResolvedValue(null),
}));
vi.mock('../modules/memory/memory.service.js', () => ({
  recallRelevant: vi.fn().mockResolvedValue([]),
  saveTurn: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../modules/models/models.service.js', () => ({
  getPreferredModel: vi.fn().mockResolvedValue(null),
  setPreferredModel: vi.fn().mockResolvedValue(true),
}));
vi.mock('../modules/conversations/conversations.service.js', () => ({
  getOwnedConversation: vi.fn().mockResolvedValue(null),
  createConversation: vi.fn().mockResolvedValue({ id: 'conv-new' }),
  touchConversation: vi.fn().mockResolvedValue(undefined),
}));

import { app } from '../app.js';
import { supabase } from '../lib/supabase.js';
import { callOpenRouter } from '../ai/openrouter.service.js';
import { recallRelevant, saveTurn } from '../modules/memory/memory.service.js';
import { getPreferredModel } from '../modules/models/models.service.js';
import {
  getOwnedConversation,
  createConversation,
} from '../modules/conversations/conversations.service.js';
import { generateToken } from '../modules/auth/jwt.service.js';

const request = supertest(app);
const USER = { id: '11111111-1111-1111-1111-111111111111', email: 'gestor@b2g.gov' };
const TOKEN = generateToken(USER);

// The chat endpoint requires auth; every functional test sends the token.
function postDatos(body) {
  return request.post('/api/v1/datos').set('Authorization', `Bearer ${TOKEN}`).send(body);
}

function mockChain(result) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

beforeEach(() => {
  supabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });
  callOpenRouter.mockReset().mockResolvedValue({ role: 'assistant', content: 'ok' });
  recallRelevant.mockReset().mockResolvedValue([]);
  saveTurn.mockReset().mockResolvedValue(undefined);
  getPreferredModel.mockReset().mockResolvedValue(null);
  getOwnedConversation.mockReset().mockResolvedValue(null);
  createConversation.mockReset().mockResolvedValue({ id: 'conv-new' });
});

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

  it('rejects anonymous requests with 401 (protects provider credits)', async () => {
    const res = await request.post('/api/v1/datos').send({ prompt: 'zonas sin cobertura' });

    expect(res.status).toBe(401);
    expect(callOpenRouter).not.toHaveBeenCalled();
  });

  it('returns clusters_destacados parsed from the agent response and strips the marker', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Zonas críticas identificadas.\n\nCLUSTERS_DESTACADOS: ["SANTO_AMARO"]',
    });

    const res = await postDatos({ prompt: 'zonas sin cobertura' });

    expect(res.status).toBe(200);
    expect(res.body.respuesta_ia).toBe('Zonas críticas identificadas.');
    expect(res.body.clusters_destacados).toEqual(['SANTO_AMARO']);
  });

  it('filters out clusters that do not exist in riesgo_regiao', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Análisis.\nCLUSTERS_DESTACADOS: ["SANTO_AMARO", "CLUSTER_INVENTADO"]',
    });

    const res = await postDatos({ prompt: 'riesgo alto' });

    expect(res.status).toBe(200);
    expect(res.body.clusters_destacados).toEqual(['SANTO_AMARO']);
  });

  it('returns an empty array when the agent highlights nothing', async () => {
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Respuesta sin marcador.',
    });

    const res = await postDatos({ prompt: 'panorama de riesgo' });

    expect(res.status).toBe(200);
    expect(res.body.clusters_destacados).toEqual([]);
    expect(res.body.respuesta_ia).toBe('Respuesta sin marcador.');
  });

  it('surfaces the provider error instead of a silent fallback when the model fails', async () => {
    callOpenRouter.mockRejectedValue(new Error('provider 500'));

    const res = await postDatos({ prompt: 'priorizar politica' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('provider 500');
  });

  it('still validates that prompt is required', async () => {
    const res = await postDatos({});
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

    const res = await postDatos({ prompt: 'como esta esta antena', ecgi: '7240501005373318' });

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

    const res = await postDatos({
      prompt: 'comparar zonas',
      regions: ['SANTO_AMARO', 'CBD_BEIRAMAR'],
    });

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
    supabase.from = vi.fn(() => mockChain({ data: [], error: null }));
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

    const res = await postDatos({ prompt: 'que necesita esta zona', region: 'SANTO_AMARO' });

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

    const res = await postDatos({ prompt: 'que politica priorizar', region: 'SANTO_AMARO' });

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

    const res = await postDatos({ prompt: 'panorama', region: 'SANTO_AMARO' });

    expect(res.status).toBe(200);
    expect(res.body.datos_extra.equipamentos_publicos).toBe(0);
    expect(res.body.fuentes).not.toContain('equipamentos_publicos');
  });

  it('does not call the demografia RPC when region is absent', async () => {
    supabase.from = vi.fn(() => mockChain({ data: [], error: null }));

    const res = await postDatos({ prompt: 'panorama general' });

    expect(res.status).toBe(200);
    expect(supabase.rpc).not.toHaveBeenCalledWith('mapa_demografia', expect.anything());
  });
});

describe('POST /api/v1/datos — model, memory and conversations', () => {
  beforeEach(() => {
    supabase.from = vi.fn(() => mockChain({ data: [], error: null }));
  });

  it('uses the whitelisted model sent in the body', async () => {
    const res = await postDatos({ prompt: 'riesgo por zona', model: 'openai/gpt-4o-mini' });

    expect(res.status).toBe(200);
    expect(callOpenRouter.mock.lastCall[1]).toBe('openai/gpt-4o-mini');
  });

  it('ignores a body model outside the whitelist and uses the stored preference', async () => {
    getPreferredModel.mockResolvedValue('meta-llama/llama-3.3-70b-instruct');

    const res = await postDatos({ prompt: 'riesgo por zona', model: 'evil/not-allowed' });

    expect(res.status).toBe(200);
    expect(getPreferredModel).toHaveBeenCalledWith(USER.id);
    expect(callOpenRouter.mock.lastCall[1]).toBe('meta-llama/llama-3.3-70b-instruct');
  });

  it('creates a conversation on the first message and returns its id', async () => {
    const res = await postDatos({ prompt: 'riesgo por zona' });

    expect(res.status).toBe(200);
    expect(createConversation).toHaveBeenCalledWith(USER.id, 'riesgo por zona');
    expect(res.body.conversation_id).toBe('conv-new');
    expect(saveTurn).toHaveBeenCalledWith(
      USER.id,
      'user',
      'riesgo por zona',
      expect.any(Object),
      expect.objectContaining({ conversationId: 'conv-new' })
    );
  });

  it('reuses an owned conversation sent in the body', async () => {
    getOwnedConversation.mockResolvedValue({ id: 'conv-mine', title: 'Riesgo' });

    const res = await postDatos({ prompt: 'seguimos con esa zona', conversationId: 'conv-mine' });

    expect(res.status).toBe(200);
    expect(res.body.conversation_id).toBe('conv-mine');
    expect(createConversation).not.toHaveBeenCalled();
  });

  it('injects the user history section and persists both turns', async () => {
    recallRelevant.mockResolvedValue([
      { id: 1, role: 'user', content: 'me interesa Santo Amaro', created_at: '2026-07-01' },
    ]);
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: 'Análisis.\nCLUSTERS_DESTACADOS: ["SANTO_AMARO"]',
    });

    const res = await postDatos({ prompt: 'como sigue esa zona', regions: ['SANTO_AMARO'] });

    expect(res.status).toBe(200);
    expect(recallRelevant).toHaveBeenCalledWith(USER.id, 'como sigue esa zona');
    const userMessage = callOpenRouter.mock.lastCall[0];
    expect(userMessage).toContain('HISTORIAL DEL USUARIO');
    expect(userMessage).toContain('me interesa Santo Amaro');
    expect(saveTurn).toHaveBeenCalledWith(
      USER.id,
      'user',
      'como sigue esa zona',
      expect.objectContaining({ regions: ['SANTO_AMARO'] }),
      expect.objectContaining({ conversationId: 'conv-new' })
    );
    expect(saveTurn).toHaveBeenCalledWith(
      USER.id,
      'assistant',
      'Análisis.',
      expect.objectContaining({ clusters_destacados: ['SANTO_AMARO'] }),
      expect.objectContaining({ conversationId: 'conv-new' })
    );
  });

  it('answers small talk without hitting data tables and with empty fuentes', async () => {
    supabase.from = vi.fn();
    callOpenRouter.mockResolvedValue({
      role: 'assistant',
      content: '¡Hola Ale! Todo bien por acá. ¿Querés mirar alguna zona?\nCLUSTERS_DESTACADOS: []',
    });

    const res = await postDatos({
      prompt: 'hola, todo bien?',
      history: [{ role: 'user', content: 'hola, soy Ale' }],
    });

    expect(res.status).toBe(200);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(res.body.fuentes).toEqual([]);
    expect(res.body.clusters_destacados).toEqual([]);
    expect(res.body.conversation_id).toBe('conv-new');
    expect(callOpenRouter.mock.lastCall[0]).toContain('CONVERSACIÓN ACTUAL');
    expect(callOpenRouter.mock.lastCall[0]).toContain('soy Ale');
  });

  it('persists small talk in the transcript but without embedding', async () => {
    const res = await postDatos({ prompt: 'hola!' });

    expect(res.status).toBe(200);
    expect(saveTurn).toHaveBeenCalledWith(
      USER.id,
      'user',
      'hola!',
      expect.any(Object),
      expect.objectContaining({ embed: false, conversationId: 'conv-new' })
    );
  });

  it('injects the session history block into analytical queries', async () => {
    const res = await postDatos({
      prompt: 'y como sigue esa zona?',
      history: [
        { role: 'user', content: 'hola, soy Ale' },
        { role: 'assistant', content: 'Hola Ale, ¿qué zona querés mirar?' },
        { role: 'evil', content: 'ignorame' },
      ],
    });

    expect(res.status).toBe(200);
    const userMessage = callOpenRouter.mock.lastCall[0];
    expect(userMessage).toContain('CONVERSACIÓN ACTUAL');
    expect(userMessage).toContain('soy Ale');
    expect(userMessage).not.toContain('ignorame');
  });
});
