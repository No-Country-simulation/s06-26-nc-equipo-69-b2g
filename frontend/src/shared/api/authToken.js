// Single in-memory holder for the backend JWT. Keeps shared/api decoupled from
// the auth feature: the auth store writes the token here and the API client
// reads it, so client.js never imports the auth module (no circular deps).
let authToken = null

export function setAuthToken(token) {
  authToken = token ?? null
}

export function getAuthToken() {
  return authToken
}
