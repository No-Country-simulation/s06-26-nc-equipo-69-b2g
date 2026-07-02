import { UnauthorizedError } from '../../utils/errors.js';
import { validateAndGetUser } from './auth.service.js';

export async function validateSession(req, res, next) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      throw new UnauthorizedError('Access token is required');
    }

    const { user, token } = await validateAndGetUser(accessToken);

    res.json({ ok: true, token, user });
  } catch (err) {
    next(err);
  }
}
