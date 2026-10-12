const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8000;
const MAX_PORT = 65_535;

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const host = (environment.HOST ?? DEFAULT_HOST).trim();
  const portValue =
    environment.BACKEND_PORT ?? environment.PORT ?? String(DEFAULT_PORT);
  const port = Number(portValue);

  if (!host) {
    throw new Error('HOST must not be empty');
  }

  if (
    !/^\d+$/.test(portValue) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > MAX_PORT
  ) {
    throw new Error(
      'BACKEND_PORT (or PORT) must be an integer between 1 and 65535',
    );
  }

  return { HOST: host, BACKEND_PORT: port };
}
