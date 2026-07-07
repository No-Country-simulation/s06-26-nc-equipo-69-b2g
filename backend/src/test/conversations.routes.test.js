import supertest from 'supertest';
import { vi, beforeEach } from 'vitest';

vi.mock('../modules/conversations/conversations.service.js', () => ({
  listConversations: vi.fn().mockResolvedValue([]),
  createConversation: vi.fn().mockResolvedValue(null),
  getConversationMessages: vi.fn().mockResolvedValue(null),
  deleteConversation: vi.fn().mockResolvedValue(false),
  getOwnedConversation: vi.fn().mockResolvedValue(null),
  touchConversation: vi.fn().mockResolvedValue(undefined),
  titleFromPrompt: vi.fn((t) => t),
}));

import { app } from '../app.js';
import {
  listConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
} from '../modules/conversations/conversations.service.js';
import { generateToken } from '../modules/auth/jwt.service.js';

const request = supertest(app);
const USER = { id: '11111111-1111-1111-1111-111111111111', email: 'gestor@b2g.gov' };
const TOKEN = generateToken(USER);
const auth = (req) => req.set('Authorization', `Bearer ${TOKEN}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/v1/conversations', () => {
  it('rejects anonymous access on every route', async () => {
    expect((await request.get('/api/v1/conversations')).status).toBe(401);
    expect((await request.post('/api/v1/conversations').send({})).status).toBe(401);
    expect((await request.get('/api/v1/conversations/x/messages')).status).toBe(401);
    expect((await request.delete('/api/v1/conversations/x')).status).toBe(401);
  });

  it('lists the caller conversations', async () => {
    listConversations.mockResolvedValue([{ id: 'c1', title: 'Riesgo Santo Amaro' }]);

    const res = await auth(request.get('/api/v1/conversations'));

    expect(res.status).toBe(200);
    expect(res.body.conversations).toEqual([{ id: 'c1', title: 'Riesgo Santo Amaro' }]);
    expect(listConversations).toHaveBeenCalledWith(USER.id);
  });

  it('creates a conversation', async () => {
    createConversation.mockResolvedValue({ id: 'c2', title: 'Nueva conversación' });

    const res = await auth(request.post('/api/v1/conversations').send({}));

    expect(res.status).toBe(201);
    expect(res.body.conversation.id).toBe('c2');
  });

  it('returns the transcript of an owned conversation', async () => {
    getConversationMessages.mockResolvedValue([{ id: 1, role: 'user', content: 'hola' }]);

    const res = await auth(request.get('/api/v1/conversations/c1/messages'));

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(getConversationMessages).toHaveBeenCalledWith(USER.id, 'c1');
  });

  it('404s when the conversation is not owned by the caller', async () => {
    getConversationMessages.mockResolvedValue(null);

    const res = await auth(request.get('/api/v1/conversations/ajena/messages'));

    expect(res.status).toBe(404);
  });

  it('deletes an owned conversation and 404s otherwise', async () => {
    deleteConversation.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const ok = await auth(request.delete('/api/v1/conversations/c1'));
    const notMine = await auth(request.delete('/api/v1/conversations/ajena'));

    expect(ok.status).toBe(200);
    expect(ok.body.deleted).toBe(true);
    expect(notMine.status).toBe(404);
  });
});
