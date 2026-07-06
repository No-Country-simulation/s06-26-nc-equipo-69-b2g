// Keeps the chat transcript across panel close/reopen and page reloads within
// the browser tab (sessionStorage). Server-side memory personalizes the AI;
// this is only the visible transcript UX.
const STORAGE_KEY = 'bit-chat-messages'
const MAX_MESSAGES = 50

export function loadChatMessages(fallback) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveChatMessages(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
  } catch {
    // Storage unavailable/full: the chat still works, just not persisted.
  }
}
