import supertest from 'supertest';
import { afterEach } from 'vitest';
import { app } from '../app.js';
import { AVAILABLE_MODELS, setCurrentModel } from '../ai/model.registry.js';

const request = supertest(app);
const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324';

// Runtime model state is module-level; reset it between tests so order doesn't
// leak the selection.
afterEach(() => {
  setCurrentModel(DEFAULT_MODEL);
});

describe('GET /api/v1/models', () => {
  it('returns the whitelist and the current model', async () => {
    const res = await request.get('/api/v1/models');

    expect(res.status).toBe(200);
    expect(res.body.models).toEqual(AVAILABLE_MODELS);
    expect(res.body.current).toBe(DEFAULT_MODEL);
  });
});

describe('POST /api/v1/models', () => {
  it('switches the active model when it is in the whitelist', async () => {
    const target = 'openai/gpt-4o-mini';

    const res = await request.post('/api/v1/models').send({ model: target });

    expect(res.status).toBe(200);
    expect(res.body.current).toBe(target);

    const check = await request.get('/api/v1/models');
    expect(check.body.current).toBe(target);
  });

  it('rejects a model that is not in the whitelist with 400', async () => {
    const res = await request.post('/api/v1/models').send({ model: 'evil/not-allowed' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not allowed');
    expect(res.body.allowed).toContain(DEFAULT_MODEL);
  });

  it('rejects a missing model with 400', async () => {
    const res = await request.post('/api/v1/models').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('model is required');
  });
});
