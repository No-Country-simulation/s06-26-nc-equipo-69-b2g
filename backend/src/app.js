import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { logger, httpLogger } from './config/logger.js';
import corsConfig from './config/cors.js';
import { setupSwagger } from './config/swagger.js';
import { globalRateLimit } from './config/rateLimit.js';
import { router } from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { createErrorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(corsConfig);
app.use(globalRateLimit);
app.use(httpLogger);
app.use(express.json({ limit: '10kb' }));

setupSwagger(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', router);

// These two must be last — order matters in Express
app.use(notFound);
app.use(createErrorHandler(logger));

export { app, logger };
