import pino from 'pino';
import pinoHttp from 'pino-http';

const logger = pino({
  level: 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

const httpLogger = pinoHttp({ logger });

export { logger, httpLogger };