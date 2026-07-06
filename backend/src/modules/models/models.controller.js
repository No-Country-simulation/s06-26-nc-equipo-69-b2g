import { getAvailableModels, getDefaultModel, isModelAllowed } from '../../ai/model.registry.js';
import { getPreferredModel, setPreferredModel } from './models.service.js';

/**
 * GET /api/v1/models — optionalAuth.
 * Lists the selectable models and the caller's current model: their persisted
 * preference when authenticated, the server default otherwise.
 */
export async function getModels(req, res, next) {
  try {
    const preferred = req.user ? await getPreferredModel(req.user.id) : null;
    res.json({
      models: getAvailableModels(),
      current: preferred ?? getDefaultModel(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/models  body: { model: string } — requireAuth.
 * Persists the model choice for THIS user (cross-device). It no longer
 * mutates any server-global state.
 */
export async function setModel(req, res, next) {
  try {
    const { model } = req.body ?? {};

    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'model is required' });
    }

    if (!isModelAllowed(model)) {
      return res.status(400).json({
        error: `model "${model}" is not allowed`,
        allowed: getAvailableModels().map((m) => m.id),
      });
    }

    await setPreferredModel(req.user.id, model);
    res.json({ current: model });
  } catch (err) {
    next(err);
  }
}
