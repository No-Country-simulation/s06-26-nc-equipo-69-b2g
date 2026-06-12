import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { logger, httpLogger } from './config/logger.js';
import corsConfig from './config/cors.js';

const app = express();

app.use(helmet());
app.use(corsConfig);
app.use(httpLogger);  
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app, logger };