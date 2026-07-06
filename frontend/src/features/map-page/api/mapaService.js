import { apiGet } from '@/shared/api/client'

const MAPA_BASE = '/api/v1/mapa'

/**
 * Data access layer for the map endpoints. Components and map layers
 * depend on these functions, never on fetch or env vars directly.
 *
 * All map data is static per session, so responses are cached in memory.
 * Caching the promise (not the result) also deduplicates concurrent
 * requests to the same endpoint.
 */

const cache = new Map()

function cachedGet(key, path, params) {
  if (!cache.has(key)) {
    const promise = apiGet(path, params).catch((err) => {
      // Failed requests must not poison the cache, so retries stay possible
      cache.delete(key)
      throw err
    })
    cache.set(key, promise)
  }
  return cache.get(key)
}

export function getConcentracao(periodo = 'MANHA') {
  return cachedGet(`concentracao:${periodo}`, `${MAPA_BASE}/concentracao`, { periodo })
}

export function getClusters() {
  return cachedGet('clusters', `${MAPA_BASE}/clusters`)
}

export function getDemografia() {
  return cachedGet('demografia', `${MAPA_BASE}/demografia`)
}

export function getOD() {
  return cachedGet('od', `${MAPA_BASE}/od`)
}
