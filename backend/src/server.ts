import 'dotenv/config';
import app from './app.js';
import { readConfig } from './config/env.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function startServer(): void {
  const config = readConfig();
  const server = app.listen(config.BACKEND_PORT, config.HOST, () => {
    console.log(
      `Server is running at http://${config.HOST}:${config.BACKEND_PORT}`,
    );
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(
      'Failed to start HTTP server:',
      error.code ?? error.message,
    );
    process.exitCode = 1;
  });

  let shuttingDown = false;

  function shutdown(signal: NodeJS.Signals): void {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully...`);

    const shutdownTimer = setTimeout(() => {
      console.error('Shutdown timed out. Closing remaining connections.');
      process.exitCode = 1;
      server.closeAllConnections();
    }, SHUTDOWN_TIMEOUT_MS);
    shutdownTimer.unref();

    server.close((error) => {
      clearTimeout(shutdownTimer);
      if (error) {
        console.error('Failed to close HTTP server:', error.message);
        process.exitCode = 1;
        return;
      }
      console.log('HTTP server closed');
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

try {
  startServer();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Server initialization failed',
  );
  process.exitCode = 1;
}
