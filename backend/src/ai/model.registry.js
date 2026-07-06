import { env } from '../config/env.js';

/**
 * Curated whitelist of OpenRouter models the product allows the user to pick
 * from the chat. Keep the ids exactly as OpenRouter expects them
 * (https://openrouter.ai/models). Editing this array is the only place needed
 * to add/remove a selectable model.
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
    id: 'google/gemini-2.0-flash-001',
    label: 'Gemini 2.0 Flash',
    description: 'Baja latencia de Google.',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    label: 'Claude 3.5 Haiku',
    description: 'Respuestas concisas y rápidas de Anthropic.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    description: 'Modelo abierto de Meta.',
  },
];

function resolveInitialModel() {
  const fromEnv = env.OPENROUTER_MODEL;
  const isAllowed = AVAILABLE_MODELS.some((m) => m.id === fromEnv);
  // If the env default isn't in the whitelist, fall back to the first allowed
  // model so the runtime never serves a model the UI can't display/select.
  return isAllowed ? fromEnv : AVAILABLE_MODELS[0].id;
}

// Runtime selection. In-memory on purpose: the user changes the model live from
// the chat without a redeploy. On a full process restart (e.g. Render cold
// start) it resets to the env default — acceptable for this product scope.
let currentModel = resolveInitialModel();

export function getAvailableModels() {
  return AVAILABLE_MODELS;
}

export function isModelAllowed(id) {
  return AVAILABLE_MODELS.some((m) => m.id === id);
}

export function getCurrentModel() {
  return currentModel;
}

/**
 * Sets the active model. Returns the new current model.
 * Throws if the id is not in the whitelist — the controller maps that to 400.
 */
export function setCurrentModel(id) {
  if (!isModelAllowed(id)) {
    throw new Error(`Model "${id}" is not in the allowed list`);
  }
  currentModel = id;
  return currentModel;
}
