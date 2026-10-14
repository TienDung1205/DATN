import type { UserAuthRepository } from '../../../repositories/client/auth.repository.js';
import type { UserAuthConfig } from '../../../config/userAuth.js';
import { createUserSessions } from './authSession.service.js';
import { createUserAccess } from './authAccess.service.js';
import { createUserLoginSessions } from './authLogin.service.js';

export async function createUserAuthService(repository: UserAuthRepository, config: UserAuthConfig) {
  const registration = createUserSessions(repository);
  const access = await createUserAccess(config);
  const sessions = createUserLoginSessions(repository, config, access);

  return {
    register: registration.register,
    login: sessions.login,
    refresh: sessions.refresh,
    logout: sessions.logout,
    authenticate: sessions.authenticate,
  };
}

export type UserAuthService = Awaited<ReturnType<typeof createUserAuthService>>;
