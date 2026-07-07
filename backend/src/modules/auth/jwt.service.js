import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

// Token exchange: the Supabase access token is only used once (POST /auth/session);
// after that the frontend authenticates with THIS token, so the backend owns the
// session lifecycle. Verified by middlewares/requireAuth.js.

export function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
