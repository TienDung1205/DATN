import type { PrismaClient } from '../generated/prisma/client.js';
import * as userAuthSettings from './userAuth.js';
import * as userAuthRepository from '../repositories/client/auth.repository.js';
import * as userAuth from '../services/client/auth/auth.service.js';

export function createAuthServices(client: PrismaClient) {
  const userAuthConfig = userAuthSettings.readUserAuthConfig(process.env);
  const userAuthService = userAuth.createUserAuthService(
    userAuthRepository.createUserAuthRepository(client),
  );
  return { userAuthConfig, userAuthService };
}
