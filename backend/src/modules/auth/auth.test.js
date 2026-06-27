import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

describe('POST /api/v1/auth/session', () => {
  it('returns 401 when no access token is provided', async () => {
    const res = await request.post('/api/v1/auth/session').send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for invalid token', async () => {
    const res = await request.post('/api/v1/auth/session').send({
      accessToken: 'invalid-token',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});