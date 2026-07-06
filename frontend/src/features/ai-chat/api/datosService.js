import { apiPost } from '@/shared/api/client'

/**
 * AI analytical query (RAG). `context` comes from map interactions:
 * { region } or { regions } after clicking zones, { ecgi } after clicking an antenna.
 * The backend gives ecgi priority over region(s) for antenna-level network data.
 *
 * Response: { respuesta_ia, clusters_destacados, datos_extra, fuentes }
 */
export function askTerritorio(prompt, context = {}) {
  const regions = [...new Set([...(context.regions ?? []), context.region].filter(Boolean))]

  return apiPost('/api/v1/datos', {
    prompt,
    ...(regions[0] ? { region: regions[0] } : {}),
    ...(regions.length > 0 ? { regions } : {}),
    ...(context.ecgi ? { ecgi: context.ecgi } : {}),
    language: 'es',
  })
}
