import { apiPost } from '@/shared/api/client'
import { getSelectedModel } from './modelStore'

/**
 * AI analytical query (RAG). `context` comes from map interactions:
 * { region } or { regions } after clicking zones, { ecgi } after clicking an antenna.
 * The backend gives ecgi priority over region(s) for antenna-level network data.
 *
 * Response: { respuesta_ia, clusters_destacados, datos_extra, fuentes }
 */
export function askTerritorio(prompt, context = {}, history = [], conversationId = null) {
  const regions = [...new Set([...(context.regions ?? []), context.region].filter(Boolean))]
  const model = getSelectedModel()

  return apiPost('/api/v1/datos', {
    prompt,
    ...(regions[0] ? { region: regions[0] } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    ...(context.ecgi ? { ecgi: context.ecgi } : {}),
    ...(model ? { model } : {}),
    // Last visible turns so the AI keeps the thread of this session.
    ...(history.length > 0 ? { history } : {}),
    // Thread id: the backend appends the turns to this conversation (or
    // creates one and returns conversation_id when absent).
    ...(conversationId ? { conversationId } : {}),
    language: 'es',
  })
}
