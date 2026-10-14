import type { PrismaClient } from '../generated/prisma/client.js';
import { readUserAuthConfig } from './userAuth.js';
import { createUserAuthRepository } from '../repositories/client/auth.repository.js';
import { createUserAuthService } from '../services/client/auth/auth.service.js';
import { readAdminAuthConfig } from './adminAuth.js';
import { createAdminAuthRepository } from '../repositories/admin/auth.repository.js';
import { createAdminAuthService } from '../services/admin/auth/auth.service.js';

export async function createAuthServices(client: PrismaClient) {
  const userAuthConfig = readUserAuthConfig(process.env);
  const adminAuthConfig = readAdminAuthConfig(process.env);
  const repository = createUserAuthRepository(client);
  const userAuthService = await createUserAuthService(repository, userAuthConfig);
  const adminRepository = createAdminAuthRepository(client);
  const adminAuthService = await createAdminAuthService(adminRepository, adminAuthConfig);

  return { userAuthConfig, userAuthService, adminAuthConfig, adminAuthService };
}
