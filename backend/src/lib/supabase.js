import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
// Accept either the legacy anon JWT (SUPABASE_ANON_KEY) or the new publishable
// key format (SUPABASE_PUBLISHABLE_KEY). Both are public, RLS-enforced keys.
const supabaseKey =
  (process.env.SUPABASE_ANON_KEY || '').trim() ||
  (process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY in environment'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
