import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
const examplePath = fileURLToPath(new URL('../../.env.example', import.meta.url));
const assignmentPattern = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=(.*)$/;

try {
  const content = await readFile(envPath, 'utf8');
  const example = await readFile(examplePath, 'utf8');
  const existingValues = new Map();
  const templateKeys = new Set();

  for (const line of content.split(/\r?\n/)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      continue;
    }

    const match = line.match(assignmentPattern);
    if (!match || existingValues.has(match[1])) {
      throw new Error('Root .env must use unique, single-line KEY=value settings. No changes were written.');
    }

    existingValues.set(match[1], match[2]);
  }

  const lineEnding = example.includes('\r\n') ? '\r\n' : '\n';
  const updatedLines = [];

  for (const line of example.split(/\r?\n/)) {
    const match = line.match(assignmentPattern);

    if (!match) {
      updatedLines.push(line);
      continue;
    }

    const [, key, sampleValue] = match;
    templateKeys.add(key);
    const hasExistingValue = existingValues.has(key);
    let value = sampleValue;

    if (hasExistingValue) {
      value = existingValues.get(key);
    }

    const isAccessTokenSecret = key === 'USER_ACCESS_TOKEN_SECRET' || key === 'ADMIN_ACCESS_TOKEN_SECRET';
    const isSampleSecret = /^(?:CHANGE_ME|'CHANGE_ME'|"CHANGE_ME")$/.test(value.trim());

    if (isAccessTokenSecret && (!hasExistingValue || isSampleSecret)) {
      value = randomBytes(32).toString('hex');
    }

    updatedLines.push(`${key}=${value}`);
  }

  for (const key of existingValues.keys()) {
    if (!templateKeys.has(key)) {
      throw new Error('Root .env contains settings missing from .env.example. Update the sample first; no settings were removed.');
    }
  }

  const updatedContent = updatedLines.join(lineEnding);
  if (updatedContent !== content) {
    await writeFile(envPath, updatedContent, 'utf8');
  }

  console.log('Root .env follows .env.example comments and order; existing values were preserved.');
} catch (error) {
  if (error instanceof Error && !('code' in error)) {
    console.error(error.message);
  } else {
    console.error('Could not update root .env. Create it from .env.example and check file permissions.');
  }
  process.exitCode = 1;
}
