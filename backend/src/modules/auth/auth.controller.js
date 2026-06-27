import { validateAndGetUser } from './auth.service.js';

export async function validateSession(req, res, next) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    const user = await validateAndGetUser(accessToken);

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}