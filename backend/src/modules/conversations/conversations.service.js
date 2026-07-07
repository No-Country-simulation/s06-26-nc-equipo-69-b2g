import { supabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../config/logger.js';

// All operations run with the service role (owner-only RLS) and are scoped by
// user_id in every query so one user can never touch another user's threads.

const TITLE_MAX_CHARS = 60;

export function titleFromPrompt(prompt) {
  const clean = String(prompt ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return 'Nueva conversación';
  return clean.length > TITLE_MAX_CHARS ? `${clean.slice(0, TITLE_MAX_CHARS - 1)}…` : clean;
}

export async function listConversations(userId) {
  if (!supabaseAdmin || !userId) return [];

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    logger.warn({ err: error, userId }, 'listConversations failed');
    return [];
  }
  return data ?? [];
}

/** Creates a thread and returns it, or null when persistence is unavailable. */
export async function createConversation(userId, title) {
  if (!supabaseAdmin || !userId) return null;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: userId, title: titleFromPrompt(title) })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) {
    logger.warn({ err: error, userId }, 'createConversation failed');
    return null;
  }
  return data;
}

/** Returns the conversation only if it belongs to the user. */
export async function getOwnedConversation(userId, conversationId) {
  if (!supabaseAdmin || !userId || !conversationId) return null;

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  return error ? null : (data ?? null);
}

/** Chronological transcript of one owned conversation. */
export async function getConversationMessages(userId, conversationId) {
  const owned = await getOwnedConversation(userId, conversationId);
  if (!owned) return null;

  const { data, error } = await supabaseAdmin
    .from('conversation_memory')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    logger.warn({ err: error, conversationId }, 'getConversationMessages failed');
    return [];
  }
  return data ?? [];
}

/** Deletes the thread (its turns cascade). Returns true when it was owned. */
export async function deleteConversation(userId, conversationId) {
  const owned = await getOwnedConversation(userId, conversationId);
  if (!owned) return false;

  const { error } = await supabaseAdmin.from('conversations').delete().eq('id', conversationId);

  if (error) {
    logger.warn({ err: error, conversationId }, 'deleteConversation failed');
    return false;
  }
  return true;
}

/** Bumps updated_at so the thread sorts to the top of the list. */
export async function touchConversation(conversationId) {
  if (!supabaseAdmin || !conversationId) return;

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    logger.warn({ err: error, conversationId }, 'touchConversation failed');
  }
}
