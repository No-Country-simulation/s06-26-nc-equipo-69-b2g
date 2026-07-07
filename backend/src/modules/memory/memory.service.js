import { supabaseAdmin } from '../../lib/supabase.js';
import { embedText } from '../../ai/embeddings.service.js';
import { logger } from '../../config/logger.js';

// conversation_memory has owner-only RLS; the backend reads/writes every
// user's rows with the service role. Without the key the feature degrades to
// a no-op instead of breaking the chat.

const RECENT_TURNS = 4;

/**
 * Persists one chat turn for the user. Embeds the content when possible so
 * the turn is retrievable by similarity; inserts without embedding otherwise
 * (still visible to recency-based recall and the transcript). Pass
 * `embed: false` for turns that belong in the transcript but must not pollute
 * similarity retrieval (greetings/small talk).
 */
export async function saveTurn(
  userId,
  role,
  content,
  metadata = {},
  { embed = true, conversationId = null } = {}
) {
  if (!supabaseAdmin || !userId || !content) return;

  const embedding = embed ? await embedText(content) : null;

  const { error } = await supabaseAdmin.from('conversation_memory').insert({
    user_id: userId,
    role,
    content,
    embedding,
    metadata,
    conversation_id: conversationId,
  });

  if (error) {
    logger.warn({ err: error, userId, role }, 'conversation_memory insert failed');
  }
}

/**
 * Returns the turns most useful as context for `prompt`: semantic matches
 * (match_conversation_memory RPC) merged with the last few turns by recency —
 * similarity alone loses the thread of the immediately previous message.
 * Deduped by id, oldest first. Empty array on any failure.
 */
export async function recallRelevant(userId, prompt, { matchCount = 5 } = {}) {
  if (!supabaseAdmin || !userId) return [];

  try {
    const [similar, recent] = await Promise.all([
      recallBySimilarity(userId, prompt, matchCount),
      recallByRecency(userId),
    ]);

    const byId = new Map();
    for (const turn of [...similar, ...recent]) {
      byId.set(turn.id, turn);
    }

    return [...byId.values()].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } catch (err) {
    logger.warn({ err, userId }, 'conversation_memory recall failed');
    return [];
  }
}

/** Deletes the whole history of one user ("borrar mi historial"). */
export async function clearMemory(userId) {
  if (!supabaseAdmin || !userId) return false;

  const { error } = await supabaseAdmin.from('conversation_memory').delete().eq('user_id', userId);

  if (error) {
    logger.warn({ err: error, userId }, 'conversation_memory delete failed');
    return false;
  }
  return true;
}

async function recallBySimilarity(userId, prompt, matchCount) {
  const embedding = await embedText(prompt);
  if (!embedding) return [];

  const { data, error } = await supabaseAdmin.rpc('match_conversation_memory', {
    p_user_id: userId,
    query_embedding: embedding,
    match_count: matchCount,
  });

  return !error && Array.isArray(data) ? data : [];
}

async function recallByRecency(userId) {
  const { data, error } = await supabaseAdmin
    .from('conversation_memory')
    .select('id, role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(RECENT_TURNS);

  return !error && Array.isArray(data) ? data : [];
}
