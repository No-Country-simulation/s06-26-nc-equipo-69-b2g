import { apiPost } from '@/shared/api/client'

/**
 * AI analytical query (RAG). `context` comes from map interactions:
 * { region } after clicking a zone, { ecgi } after clicking an antenna.
 * The backend gives ecgi priority over region for network data.
 *
 * Response: { respuesta_ia, clusters_destacados, datos_extra, fuentes }
 */
export function askTerritorio(prompt, context = {}) {
  return apiPost('/api/v1/datos', {
    prompt,
    ...(context.region ? { region: context.region } : {}),
    ...(context.ecgi ? { ecgi: context.ecgi } : {}),
    language: 'es',
  })
}
