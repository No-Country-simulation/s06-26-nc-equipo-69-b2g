import {
  getAvailableModels,
  getCurrentModel,
  isModelAllowed,
  setCurrentModel,
} from '../../ai/model.registry.js';

/**
 * GET /api/v1/models
 * Lists the selectable models and which one is currently active.
 */
export function getModels(_req, res) {
  res.json({
    models: getAvailableModels(),
    current: getCurrentModel(),
  });
}

/**
 * POST /api/v1/models  body: { model: string }
 * Switches the active model for every subsequent AI query. No redeploy needed.
 */
export function setModel(req, res) {
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

  const current = setCurrentModel(model);
  res.json({ current });
}
