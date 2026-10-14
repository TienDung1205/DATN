import type { PrismaClient } from '../generated/prisma/client.js';
import { readUserAuthConfig } from './userAuth.js';
import { createUserAuthRepository } from '../repositories/client/auth.repository.js';
import { createUserAuthService } from '../services/client/auth/auth.service.js';

export async function createAuthServices(client: PrismaClient) {
  const userAuthConfig = readUserAuthConfig(process.env);
  const repository = createUserAuthRepository(client);
  const userAuthService = await createUserAuthService(repository, userAuthConfig);

  return { userAuthConfig, userAuthService };
}
