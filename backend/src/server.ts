import 'dotenv/config';
import app from './app.js';

const DEFAULT_PORT = 3000;
const parsedPort = Number(process.env.PORT ?? DEFAULT_PORT);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const server = app.listen(parsedPort, () => {
  console.log(`Server is running at http://localhost:${parsedPort}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close((error) => {
    if (error) {
      console.error('Failed to close HTTP server:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
