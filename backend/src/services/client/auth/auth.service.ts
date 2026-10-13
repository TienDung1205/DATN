import type { UserAuthRepository } from '../../../repositories/client/auth.repository.js';
import * as sessions from './authSession.service.js';

export function createUserAuthService(repository: UserAuthRepository) {
  return sessions.createUserSessions(repository);
}

export type UserAuthService = ReturnType<typeof createUserAuthService>;
