import { vi, beforeEach } from 'vitest';

const { adminMock, embedTextMock } = vi.hoisted(() => ({
  adminMock: { from: vi.fn(), rpc: vi.fn() },
  embedTextMock: vi.fn(),
}));

// Override the global setup mock: memory needs a working service-role client.
vi.mock('../lib/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: adminMock,
}));
vi.mock('../ai/embeddings.service.js', () => ({
  embedText: embedTextMock,
}));

import { saveTurn, recallRelevant, clearMemory } from '../modules/memory/memory.service.js';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const EMBEDDING = [0.1, 0.2, 0.3];

beforeEach(() => {
  adminMock.from.mockReset();
  adminMock.rpc.mockReset();
  embedTextMock.mockReset();
});

describe('saveTurn', () => {
  it('inserts the turn with its embedding when embedText succeeds', async () => {
    embedTextMock.mockResolvedValue(EMBEDDING);
    const insert = vi.fn().mockResolvedValue({ error: null });
    adminMock.from.mockReturnValue({ insert });

    await saveTurn(USER_ID, 'user', 'zonas sin cobertura', { regions: ['SANTO_AMARO'] });

    expect(adminMock.from).toHaveBeenCalledWith('conversation_memory');
    expect(insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      role: 'user',
      content: 'zonas sin cobertura',
      embedding: EMBEDDING,
      metadata: { regions: ['SANTO_AMARO'] },
    });
  });

  it('still inserts (without embedding) when embedText degrades to null', async () => {
    embedTextMock.mockResolvedValue(null);
    const insert = vi.fn().mockResolvedValue({ error: null });
    adminMock.from.mockReturnValue({ insert });

    await saveTurn(USER_ID, 'assistant', 'respuesta', {});

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'respuesta', embedding: null })
    );
  });

  it('does nothing without content', async () => {
    await saveTurn(USER_ID, 'user', '', {});
    expect(adminMock.from).not.toHaveBeenCalled();
  });
});

describe('recallRelevant', () => {
  function mockRecency(rows) {
    adminMock.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    });
  }

  it('merges similarity and recency, dedupes by id and sorts chronologically', async () => {
    embedTextMock.mockResolvedValue(EMBEDDING);
    adminMock.rpc.mockResolvedValue({
      data: [
        { id: 1, role: 'user', content: 'viejo', created_at: '2026-07-01T10:00:00Z' },
        { id: 2, role: 'assistant', content: 'medio', created_at: '2026-07-03T10:00:00Z' },
      ],
      error: null,
    });
    mockRecency([
      { id: 3, role: 'user', content: 'reciente', created_at: '2026-07-05T10:00:00Z' },
      { id: 2, role: 'assistant', content: 'medio', created_at: '2026-07-03T10:00:00Z' },
    ]);

    const turns = await recallRelevant(USER_ID, 'que zonas me interesaban');

    expect(adminMock.rpc).toHaveBeenCalledWith('match_conversation_memory', {
      p_user_id: USER_ID,
      query_embedding: EMBEDDING,
      match_count: 5,
    });
    expect(turns.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('falls back to recency-only when embeddings are unavailable', async () => {
    embedTextMock.mockResolvedValue(null);
    mockRecency([{ id: 9, role: 'user', content: 'ultimo', created_at: '2026-07-05T10:00:00Z' }]);

    const turns = await recallRelevant(USER_ID, 'seguimos');

    expect(adminMock.rpc).not.toHaveBeenCalled();
    expect(turns.map((t) => t.id)).toEqual([9]);
  });

  it('returns [] on failure instead of breaking the chat', async () => {
    embedTextMock.mockResolvedValue(EMBEDDING);
    adminMock.rpc.mockRejectedValue(new Error('rpc down'));
    adminMock.from.mockImplementation(() => {
      throw new Error('db down');
    });

    await expect(recallRelevant(USER_ID, 'hola de nuevo')).resolves.toEqual([]);
  });
});

describe('clearMemory', () => {
  it('deletes only the rows of the given user', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    adminMock.from.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq }) });

    const ok = await clearMemory(USER_ID);

    expect(ok).toBe(true);
    expect(adminMock.from).toHaveBeenCalledWith('conversation_memory');
    expect(eq).toHaveBeenCalledWith('user_id', USER_ID);
  });
});
