import { NotFoundError } from '../utils/errors.js';

export function notFound(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.url} not found`));
}
