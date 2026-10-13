import dotenv from 'dotenv';
import { createApplication } from './config/application.js';
import { createDatabase } from './config/database.js';
import { readDatabaseConfig } from './config/databaseConfig.js';
import { readConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { configureServerLifecycle } from './config/serverLifecycle.js';

dotenv.config({ quiet: true });

try {
  const config = readConfig(process.env);
  const logger = createLogger(config);
  const database = createDatabase(readDatabaseConfig(process.env));
  let cleanupTask: Promise<void> | undefined;

  const closeResources = (): Promise<void> => {
    cleanupTask ??= database.close();
    return cleanupTask;
  };

  try {
    await database.check();
    const application = createApplication(config, logger, database);
    const { app } = application;
    const port = config.BACKEND_PORT;
    const host = config.HOST;

    const server = app.listen(port, host, () => {
      logger.info(
        { event: 'server_started', host, port },
        'Server is running at http://' + host + ':' + port,
      );
    });
    configureServerLifecycle(server, config, logger, closeResources);
  } catch (error) {
    await closeResources();
    throw error;
  }
} catch (error) {
  const configErrorPrefixes = [
    'Invalid environment configuration:',
    'Invalid database configuration:',
  ];
  const message =
    error instanceof Error &&
    configErrorPrefixes.some((prefix) => error.message.startsWith(prefix))
      ? error.message
      : 'Server initialization failed. Check PostgreSQL, DATABASE_URL and user registration migration.';
  console.error(message);
  process.exitCode = 1;
}
