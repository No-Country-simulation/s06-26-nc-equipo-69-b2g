import { apiGet, apiDelete } from '@/shared/api/client'

/**
 * ChatGPT-style threads: every chat belongs to a conversation persisted
 * server-side, so the user can switch, resume and delete past chats from any
 * device. All endpoints require the session token.
 */
export function getConversations() {
  return apiGet('/api/v1/conversations')
}

export function getConversationMessages(conversationId) {
  return apiGet(`/api/v1/conversations/${conversationId}/messages`)
}

export function deleteConversation(conversationId) {
  return apiDelete(`/api/v1/conversations/${conversationId}`)
}
