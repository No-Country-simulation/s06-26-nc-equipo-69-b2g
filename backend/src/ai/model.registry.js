import { env } from '../config/env.js';

/**
 * Curated whitelist of OpenRouter models the product allows the user to pick
 * from the chat. Keep the ids exactly as OpenRouter expects them
 * (https://openrouter.ai/models). Editing this array is the only place needed
 * to add/remove a selectable model. Ids verified against the live
 * GET https://openrouter.ai/api/v1/models catalog (2026-07-06).
 */
export const AVAILABLE_MODELS = [
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    label: 'DeepSeek Chat v3',
    description: 'Buen balance calidad/costo. Modelo por defecto.',
  },
  {
    id: 'openai/gpt-4o-mini',
    label: 'GPT-4o mini',
    description: 'Rápido y económico de OpenAI.',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Baja latencia de Google.',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
    description: 'Respuestas concisas y rápidas de Anthropic.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    description: 'Modelo abierto de Meta.',
  },
];

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}

export function isModelAllowed(id) {
  return AVAILABLE_MODELS.some((m) => m.id === id);
}

/**
 * Server-wide default when neither the request nor the user profile carries a
 * model. There is no global "current model" anymore: the selection is per
 * user/request (see modules/models and query.controller).
 */
export function getDefaultModel() {
  const fromEnv = env.OPENROUTER_MODEL;
  // If the env default isn't in the whitelist, fall back to the first allowed
  // model so the runtime never serves a model the UI can't display/select.
  return isModelAllowed(fromEnv) ? fromEnv : AVAILABLE_MODELS[0].id;
}
