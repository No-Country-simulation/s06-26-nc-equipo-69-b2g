import { clearMemory } from './memory.service.js';

/**
 * DELETE /api/v1/memory — requireAuth.
 * "Borrar mi historial": removes every conversation_memory row of the caller.
 */
export async function deleteMemory(req, res, next) {
  try {
    const deleted = await clearMemory(req.user.id);
    res.json({ deleted });
  } catch (err) {
    next(err);
  }
}
