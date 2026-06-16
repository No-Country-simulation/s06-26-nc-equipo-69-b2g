import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../utils/errors.js';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(_req, _res, next) {
    next(new TooManyRequestsError('Rate limit exceeded. Try again in 15 minutes.'));
  },
});
