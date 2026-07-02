import { verifyToken } from '../modules/auth/jwt.service.js';
import { UnauthorizedError } from '../utils/errors.js';

// Protects a route with the backend-issued session token (see auth/jwt.service.js).
// Usage: router.get('/ruta', requireAuth, handler) — handler reads req.user.
export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorizedError('Missing bearer token'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
