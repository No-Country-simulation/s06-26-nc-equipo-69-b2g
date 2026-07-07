import express from 'express';
import supertest from 'supertest';
import { requireAuth } from '../middlewares/requireAuth.js';
import { generateToken } from '../modules/auth/jwt.service.js';
import { createErrorHandler } from '../middlewares/errorHandler.js';

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Diaz',
};

function buildApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => res.json({ user: req.user }));
  app.use(createErrorHandler({ warn: () => {}, error: () => {} }));
  return supertest(app);
}

describe('requireAuth middleware', () => {
  it('rejects requests without a bearer token', async () => {
    const res = await buildApp().get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects tampered tokens', async () => {
    const res = await buildApp().get('/protected').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('attaches req.user for a token issued by our backend', async () => {
    const token = generateToken(user);
    const res = await buildApp().get('/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      email: user.email,
      firstName: 'Ana',
      lastName: 'Diaz',
    });
  });
});
