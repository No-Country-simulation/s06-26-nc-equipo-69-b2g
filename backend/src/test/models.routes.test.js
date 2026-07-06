import supertest from 'supertest';
import { vi, beforeEach } from 'vitest';

vi.mock('../modules/models/models.service.js', () => ({
  getPreferredModel: vi.fn().mockResolvedValue(null),
  setPreferredModel: vi.fn().mockResolvedValue(true),
}));

import { app } from '../app.js';
import { AVAILABLE_MODELS, getDefaultModel } from '../ai/model.registry.js';
import { generateToken } from '../modules/auth/jwt.service.js';
import { getPreferredModel, setPreferredModel } from '../modules/models/models.service.js';

const request = supertest(app);
const USER = { id: '11111111-1111-1111-1111-111111111111', email: 'gestor@b2g.gov' };
const token = generateToken(USER);

beforeEach(() => {
  getPreferredModel.mockReset().mockResolvedValue(null);
  setPreferredModel.mockReset().mockResolvedValue(true);
});

describe('GET /api/v1/models', () => {
  it('returns the whitelist and the server default for anonymous callers', async () => {
    const res = await request.get('/api/v1/models');

    expect(res.status).toBe(200);
    expect(res.body.models).toEqual(AVAILABLE_MODELS);
    expect(res.body.current).toBe(getDefaultModel());
    expect(getPreferredModel).not.toHaveBeenCalled();
  });

  it('returns the persisted preference for an authenticated user', async () => {
    getPreferredModel.mockResolvedValue('openai/gpt-4o-mini');

    const res = await request.get('/api/v1/models').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.current).toBe('openai/gpt-4o-mini');
    expect(getPreferredModel).toHaveBeenCalledWith(USER.id);
  });

  it('falls back to the default when the user has no stored preference', async () => {
    const res = await request.get('/api/v1/models').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.current).toBe(getDefaultModel());
  });
});

describe('POST /api/v1/models', () => {
  it('rejects anonymous callers with 401', async () => {
    const res = await request.post('/api/v1/models').send({ model: AVAILABLE_MODELS[0].id });

    expect(res.status).toBe(401);
    expect(setPreferredModel).not.toHaveBeenCalled();
  });

  it('persists a whitelisted model for the authenticated user', async () => {
    const target = 'openai/gpt-4o-mini';

    const res = await request
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ model: target });

    expect(res.status).toBe(200);
    expect(res.body.current).toBe(target);
    expect(setPreferredModel).toHaveBeenCalledWith(USER.id, target);
  });

  it('rejects a model that is not in the whitelist with 400', async () => {
    const res = await request
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'evil/not-allowed' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not allowed');
    expect(res.body.allowed).toContain(getDefaultModel());
    expect(setPreferredModel).not.toHaveBeenCalled();
  });

  it('rejects a missing model with 400', async () => {
    const res = await request
      .post('/api/v1/models')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('model is required');
  });
});
