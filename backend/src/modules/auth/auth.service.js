import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { generateToken } from './jwt.service.js';

// public.users has RLS enabled with no anon policies, so profile reads need
// the service role (lib/supabase.js#supabaseAdmin). Without it we fall back
// to the validated auth payload.

const USER_COLUMNS = 'id, email, first_name, last_name, avatar_url';

export async function validateAndGetUser(accessToken) {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !authUser) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const client = supabaseAdmin ?? supabase;
  const { data: appUser } = await client
    .from('users')
    .select(USER_COLUMNS)
    .eq('id', authUser.id)
    .maybeSingle();

  if (appUser) {
    return sessionFor(appUser);
  }

  // Row missing: the user pre-dates the on_auth_user_created trigger. Repair it.
  if (supabaseAdmin) {
    const { data: repaired } = await supabaseAdmin
      .from('users')
      .upsert(profileFromAuth(authUser))
      .select(USER_COLUMNS)
      .maybeSingle();
    if (repaired) {
      return sessionFor(repaired);
    }
  }

  // No readable profile row — the token is valid, answer from the auth payload.
  return sessionFor(profileFromAuth(authUser));
}

// Token exchange: every valid login returns our own session token + the user.
function sessionFor(row) {
  const user = mapUser(row);
  return { user, token: generateToken(user) };
}

function profileFromAuth(authUser) {
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email,
    first_name: meta.given_name ?? null,
    last_name: meta.family_name ?? null,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  };
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
