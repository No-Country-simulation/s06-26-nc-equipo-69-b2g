const BASE_URL = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(message, status, url) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

// Generous timeout: the API is hosted on Render's free tier, where cold
// starts after inactivity can take 30-50s before the first response.
const REQUEST_TIMEOUT_MS = 60_000

/**
 * Thin wrapper over fetch: single source of truth for the API base URL,
 * response status validation, timeout and JSON parsing.
 */
export async function apiGet(path, params) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const url = `${BASE_URL}${path}${query}`

  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!res.ok) {
    throw new ApiError(`GET ${path} failed with status ${res.status}`, res.status, url)
  }

  return res.json()
}

export async function apiPost(path, body) {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new ApiError(`POST ${path} failed with status ${res.status}`, res.status, url)
  }

  return res.json()
}
