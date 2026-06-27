import { app, logger } from './app.js';
import { supabase } from './lib/supabase.js';
import { env } from './config/env.js';

async function start() {
  const { error } = await supabase.from('_ping').select('*').limit(1);
  const isConnected =
    !error || error.code === 'PGRST205' || error.code === 'PGRST116' || error.code === '42P01';
  if (!isConnected) {
    logger.error({ err: error }, 'Supabase connection failed');
    process.exit(1);
  }
  logger.info(`Supabase connected → ${env.SUPABASE_URL}`);

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running at ${env.API_URL}`);
    logger.info(`API docs at ${env.API_URL}/api-docs`);
  });

  function shutdown(signal) {
    logger.info(`${signal} received — shutting down`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
