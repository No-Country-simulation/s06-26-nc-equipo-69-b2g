import { app, logger } from './app.js';

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en ${API_URL}`);
});