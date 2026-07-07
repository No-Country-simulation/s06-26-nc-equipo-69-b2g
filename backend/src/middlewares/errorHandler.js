import { AppError } from '../utils/errors.js';

export function createErrorHandler(logger) {
  return function errorHandler(err, req, res, _next) {
    if (err instanceof AppError) {
      const level = err.statusCode >= 500 ? 'error' : 'warn';
      logger[level]({ code: err.code, url: req.url, method: req.method }, err.message);

      return res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          statusCode: err.statusCode,
        },
      });
    }

    // Unexpected — log full stack
    logger.error({ err, url: req.url, method: req.method }, 'Unexpected error');

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500,
      },
    });
  };
}
