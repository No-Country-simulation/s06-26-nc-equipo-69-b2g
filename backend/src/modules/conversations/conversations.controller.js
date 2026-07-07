import {
  listConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
} from './conversations.service.js';

/** GET /api/v1/conversations — the caller's threads, most recent first. */
export async function getConversations(req, res, next) {
  try {
    res.json({ conversations: await listConversations(req.user.id) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/conversations  body: { title? } — starts a new thread. */
export async function postConversation(req, res, next) {
  try {
    const conversation = await createConversation(req.user.id, req.body?.title);
    if (!conversation) {
      return res.status(503).json({ error: 'conversation persistence unavailable' });
    }
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/conversations/:id/messages — chronological transcript. */
export async function getMessages(req, res, next) {
  try {
    const messages = await getConversationMessages(req.user.id, req.params.id);
    if (messages === null) {
      return res.status(404).json({ error: 'conversation not found' });
    }
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/conversations/:id — removes the thread and its turns. */
export async function removeConversation(req, res, next) {
  try {
    const deleted = await deleteConversation(req.user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'conversation not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
