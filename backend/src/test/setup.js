import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ??= 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.DATABASE_URL ??= 'postgresql://postgres:test@localhost:5432/postgres';
process.env.JWT_SECRET ??= 'test-jwt-secret-at-least-32-characters-long';

// Prevent real Supabase/DB connections in tests
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

vi.mock('../lib/db.js', () => ({
  db: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));
