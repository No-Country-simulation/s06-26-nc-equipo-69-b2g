import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { isModelAllowed } from '../../ai/model.registry.js';
import { logger } from '../../config/logger.js';

// users has RLS with no anon write policy, so persistence needs the service
// role. Reads fall back to the anon client (returns null under RLS) so a
// missing service key degrades to the default model instead of crashing.
function writeClient() {
  return supabaseAdmin ?? null;
}

/**
 * Returns the user's persisted model id, or null when unset, not readable, or
 * no longer in the whitelist (stale preference after a whitelist change).
 */
export async function getPreferredModel(userId) {
  const client = supabaseAdmin ?? supabase;
  const { data, error } = await client
    .from('users')
    .select('preferred_model')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logger.warn({ err: error, userId }, 'getPreferredModel failed');
    return null;
  }

  const model = data?.preferred_model ?? null;
  return model && isModelAllowed(model) ? model : null;
}

/**
 * Persists the user's model choice. Callers validate against the whitelist
 * first (controller returns 400); this re-checks as a safety net.
 * Returns true when persisted, false when it could not be (no service role).
 */
export async function setPreferredModel(userId, model) {
  if (!isModelAllowed(model)) {
    throw new Error(`Model "${model}" is not in the allowed list`);
  }

  const client = writeClient();
  if (!client) {
    logger.warn(
      { userId, model },
      'SUPABASE_SERVICE_ROLE_KEY missing: preferred model not persisted'
    );
    return false;
  }

  const { error } = await client
    .from('users')
    .update({ preferred_model: model, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    logger.warn({ err: error, userId, model }, 'setPreferredModel failed');
    return false;
  }

  return true;
}
