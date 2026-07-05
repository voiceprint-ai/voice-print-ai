/**
 * Server entrypoint.
 * @author Saamarth Attray
 */
import { createApp } from './app';
import { env } from './config/env';
import { getLlm } from './llm/provider';
import { logger } from './lib/logger';

// Initialize the provider eagerly so misconfiguration fails at boot, not mid-request.
getLlm();

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Voiceprint backend listening');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason: String(reason) }, 'unhandledRejection');
});