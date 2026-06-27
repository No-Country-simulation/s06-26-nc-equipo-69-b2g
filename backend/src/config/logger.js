import pino from 'pino';
import pinoHttp from 'pino-http';

const isDev = process.env.NODE_ENV !== 'production';

const prettyOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:HH:MM:ss',
    ignore: 'pid,hostname,req,res,responseTime',
    messageFormat: '{msg}',
    levelFirst: false,
  },
};

const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev ? prettyOptions : undefined,
});

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
  customSuccessMessage(req, res, responseTime) {
    return `${req.method} ${req.url} ${res.statusCode} · ${responseTime}ms`;
  },
  customErrorMessage(req, _res, err) {
    return `${req.method} ${req.url} ERROR: ${err.message}`;
  },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

export { logger, httpLogger };
