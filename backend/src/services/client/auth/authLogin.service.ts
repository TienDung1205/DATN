import { randomUUID } from 'node:crypto';
import type { User } from '../../../generated/prisma/client.js';
import type { UserAuthConfig } from '../../../config/userAuth.js';
import type * as AuthDto from '../../../dto/client/auth.dto.js';
import type { UserAuthRepository, UserStore } from '../../../repositories/client/auth.repository.js';
import type { UserAccess } from './authAccess.service.js';
import { AppError } from '../../../errors/appError.js';
import { toUserOutput } from '../../../mappers/client/auth.mapper.js';
import { hashRefreshToken, newRefreshToken } from '../../../utils/authTokens.js';
import { verifyPassword } from '../../../utils/password.js';
import { invalidLogin, invalidSession } from '../../../utils/userAuthErrors.js';

type RefreshResult = { value: AuthDto.UserSessionResult } | { error: AppError };

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

  async function refresh(refreshToken: string): Promise<AuthDto.UserSessionResult> {
    const tokenHash = hashRefreshToken(refreshToken);
    const foundSession = await repository.findSessionByHash(tokenHash);

    if (!foundSession) {
      throw invalidSession();
    }

    const userId = foundSession.userId;
    const sessionId = foundSession.id;
    const result = await repository.withUserLock(userId, (store) => rotateRefreshSession(store, userId, sessionId));

    // Thu hồi phiên phải được commit trước khi trả lỗi replay token.
    if ('error' in result) {
      throw result.error;
    }

    return result.value;
  }

  async function rotateRefreshSession(store: UserStore, userId: bigint, sessionId: bigint): Promise<RefreshResult> {
    await store.lockSession(sessionId);
    const session = await store.findSession(sessionId);
    const now = new Date();

    if (!session || session.userId !== userId) {
      return { error: invalidSession() };
    }

    if (session.revokedAt) {
      await store.revokeFamily(userId, session.familyId, now);

      const error = new AppError(
        401,
        'Refresh token đã được sử dụng. Vui lòng đăng nhập lại.',
        [{ message: 'REFRESH_TOKEN_REUSED' }],
      );

      return { error };
    }

    if (session.expiresAt <= now) {
      const error = new AppError(
        401,
        'Phiên đã hết hạn. Vui lòng đăng nhập lại.',
        [{ message: 'REFRESH_TOKEN_EXPIRED' }],
      );

      return { error };
    }

    const user = await store.findUser(userId);

    if (!user || user.status !== 'ACTIVE') {
      await store.revokeAll(userId, now);
      return { error: invalidSession() };
    }

    const nextRefreshToken = newRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    const replacement = await store.createSession({
      userId,
      familyId: session.familyId,
      tokenHash: nextTokenHash,
      expiresAt: session.expiresAt,
    });

    await store.rotateSession(session.id, replacement.id, now);

    const value = await access.issueTokens(user, replacement.id, nextRefreshToken);

    return { value };
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
    const profile = toUserOutput(user);

    return { userId, sessionId, profile };
  }

  return { login, refresh, logout, authenticate, createLoginSession };
}
