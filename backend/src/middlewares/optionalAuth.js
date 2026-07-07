import { verifyToken } from '../modules/auth/jwt.service.js';

// Like requireAuth, but never rejects: sets req.user when a valid Bearer token
// is present and lets the request through anonymously otherwise. For routes
// that work without login but personalize when the user is authenticated
// (e.g. POST /datos memory, GET /models preferred model).
export function optionalAuth(req, _res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };
    } catch {
      // Invalid/expired token on an optional route: treat as anonymous.
    }
  }

  next();
}
