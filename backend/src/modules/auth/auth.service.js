import { supabase } from '../../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { UnauthorizedError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function validateAndGetUser(accessToken) {
  const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);

  if (error || !authUser) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const { data: appUser } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, avatar_url')
    .eq('id', authUser.id)
    .single();

  if (appUser) return mapUser(appUser);

  if (supabaseAdmin) {
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.given_name || null,
        last_name: authUser.user_metadata?.family_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      })
      .select('id, email, first_name, last_name, avatar_url')
      .single();

    if (newUser) return mapUser(newUser);
  }

  throw new UnauthorizedError('User not found');
}

function mapUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
  };
}