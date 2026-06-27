import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Accept either the legacy anon JWT (SUPABASE_ANON_KEY) or the new publishable
// key format (SUPABASE_PUBLISHABLE_KEY). Both are public, RLS-enforced keys.
const supabaseKey =
  (env.SUPABASE_ANON_KEY || '').trim() ||
  (env.SUPABASE_PUBLISHABLE_KEY || '').trim();

if (!supabaseKey) {
  throw new Error(
    'Missing SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY in environment'
  );
}

export const supabase = createClient(env.SUPABASE_URL, supabaseKey);
