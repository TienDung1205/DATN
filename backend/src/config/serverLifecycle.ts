import type { Server } from 'node:http';
import type { Logger } from 'pino';
import type { AppConfig } from './env.js';
import { SERVER_TIMEOUTS } from '../constants/http.js';

export function configureServerLifecycle(server: Server, config: AppConfig, logger: Logger, closeResources: () => Promise<void>): void {
  server.requestTimeout = SERVER_TIMEOUTS.request;
  server.headersTimeout = SERVER_TIMEOUTS.headers;
  server.keepAliveTimeout = SERVER_TIMEOUTS.keepAlive;

  let shuttingDown = false;

  async function closeDatabase(): Promise<void> {
    try {
      await closeResources();
    } catch {
      process.exitCode = 1;
      logger.error({ event: 'database_close_failed' }, 'Database did not close cleanly');
    }
  }

  async function handleServerError(error: NodeJS.ErrnoException): Promise<void> {
    logger.error({ event: 'server_error', code: error.code }, 'HTTP server could not start');
    process.exitCode = 1;
    await closeDatabase();
  }

  function forceCloseConnections(): void {
    logger.error({ event: 'shutdown_timeout' }, 'Closing remaining connections');
    process.exitCode = 1;
    server.closeAllConnections();
  }

  function shutdown(signal: NodeJS.Signals): void {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ event: 'server_stopping', signal }, 'Closing HTTP server');

    const shutdownTimer = setTimeout(forceCloseConnections, config.SHUTDOWN_TIMEOUT_MS);
    shutdownTimer.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ event: 'shutdown_error' }, 'HTTP server did not close cleanly');
        process.exitCode = 1;
      } else {
        logger.info({ event: 'server_stopped' }, 'HTTP server closed');
      }

      try {
        await closeDatabase();
      } finally {
        clearTimeout(shutdownTimer);
      }
    });
  }

  server.on('error', handleServerError);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
