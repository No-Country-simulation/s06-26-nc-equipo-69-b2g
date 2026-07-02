import supertest from 'supertest';
import { vi } from 'vitest';
import { app } from '../../app.js';
import { supabase } from '../../lib/supabase.js';

const request = supertest(app);

const authUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ana@example.com',
  user_metadata: { given_name: 'Ana', family_name: 'Diaz', picture: 'https://x/avatar.png' },
};

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

  it('returns the profile row when the token is valid', async () => {
    supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: authUser }, error: null });
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: authUser.id,
          email: authUser.email,
          first_name: 'Ana',
          last_name: 'Diaz',
          avatar_url: null,
        },
        error: null,
      }),
    });

    const res = await request.post('/api/v1/auth/session').send({ accessToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toEqual({
      id: authUser.id,
      email: authUser.email,
      firstName: 'Ana',
      lastName: 'Diaz',
      avatarUrl: null,
    });
  });

  it('falls back to the auth payload when no profile row is readable', async () => {
    supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: authUser }, error: null });
    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await request.post('/api/v1/auth/session').send({ accessToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: authUser.id,
      email: authUser.email,
      firstName: 'Ana',
      lastName: 'Diaz',
      avatarUrl: 'https://x/avatar.png',
    });
  });
});
