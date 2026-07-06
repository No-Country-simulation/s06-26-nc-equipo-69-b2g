import { apiGet, apiPost } from '@/shared/api/client'

/**
 * Lists the AI models the backend allows and which one is active.
 * Response: { models: [{ id, label, description }], current: string }
 */
export function getModels() {
  return apiGet('/api/v1/models')
}

/**
 * Switches the active AI model for every subsequent chat query.
 * Response: { current: string }
 */
export function setModel(model) {
  return apiPost('/api/v1/models', { model })
}
