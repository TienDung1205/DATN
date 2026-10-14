import { randomUUID } from 'node:crypto';
import type { User } from '../../../generated/prisma/client.js';
import type { UserAuthConfig } from '../../../config/userAuth.js';
import type * as AuthDto from '../../../dto/client/auth.dto.js';
import type { UserAuthRepository, UserStore } from '../../../repositories/client/auth.repository.js';
import type { UserAccess } from './authAccess.service.js';
import { toRegisterOutput } from '../../../mappers/client/auth.mapper.js';
import { hashRefreshToken, newRefreshToken } from '../../../utils/authTokens.js';
import { verifyPassword } from '../../../utils/password.js';
import { invalidLogin, invalidSession } from '../../../utils/userAuthErrors.js';

export function createUserLoginSessions(repository: UserAuthRepository, config: UserAuthConfig, access: UserAccess) {
  async function login(input: AuthDto.LoginInput): Promise<AuthDto.UserSessionResult> {
    const user = await repository.findUserByEmail(input.email);
    const password = user?.password ?? access.dummyHash;
    const validPassword = await verifyPassword(password, input.password);

    if (!user || !validPassword || user.status !== 'ACTIVE') {
      throw invalidLogin();
    }

    return repository.withUserLock(user.id, (store) => createLoginSession(store, user));
  }

  async function createLoginSession(store: UserStore, user: User): Promise<AuthDto.UserSessionResult> {
    const freshUser = await store.findUser(user.id);

    if (!freshUser || freshUser.status !== 'ACTIVE') {
      throw invalidLogin();
    }

    if (freshUser.password !== user.password) {
      throw invalidLogin();
    }

    const refreshToken = newRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const lifetimeMilliseconds = config.USER_REFRESH_TOKEN_TTL_SECONDS * 1000;
    const expiresAt = new Date(Date.now() + lifetimeMilliseconds);

    const session = await store.createSession({
      userId: user.id,
      familyId: randomUUID(),
      tokenHash,
      expiresAt,
    });

    return access.issueTokens(freshUser, session.id, refreshToken);
  }

  async function logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const session = await repository.findSessionByHash(tokenHash);

    if (!session) {
      return;
    }

    await repository.withUserLock(session.userId, async (store) => {
      await store.revokeFamily(session.userId, session.familyId, new Date());
    });
  }

  async function authenticate(accessToken: string): Promise<AuthDto.UserPrincipal> {
    const { userId, sessionId } = await access.tokens.verify(accessToken);
    const user = await access.getCurrentUser(repository, userId, sessionId);
    const profile = toRegisterOutput(user);

    return { userId, sessionId, profile };
  }

  return { login, logout, authenticate };
}
