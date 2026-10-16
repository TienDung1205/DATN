import { randomUUID } from 'node:crypto';
import { Prisma, type User } from '../../../generated/prisma/client.js';
import type { UserAuthConfig } from '../../../config/auth.js';
import type * as AuthDto from '../../../dto/client/auth.dto.js';
import type { UserAuthRepository, UserStore } from '../../../repositories/client/auth.repository.js';
import { AppError } from '../../../errors/appError.js';
import { toUserOutput } from '../../../mappers/client/auth.mapper.js';
import { createUserTokens, hashRefreshToken, newRefreshToken } from '../../../utils/authTokens.js';
import { hashPassword, verifyPassword } from '../../../utils/password.js';
import { invalidLogin, invalidSession } from '../../../utils/authErrors.js';

type RefreshResult = { value: AuthDto.UserSessionResult } | { error: AppError };

export async function createUserAuthService(repository: UserAuthRepository, config: UserAuthConfig) {
  const tokens = createUserTokens(config);
  const dummyHash = await hashPassword(newRefreshToken());

  async function register(input: AuthDto.RegisterInput): Promise<AuthDto.UserSessionResult> {
    const password = await hashPassword(input.password);

    try {
      return await repository.withTransaction(async (store) => {
        const user = await store.createUser({
          email: input.email,
          phone: input.phone,
          fullName: input.fullName,
          password,
        });

        return createLoginSession(store, user);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'Email hoặc số điện thoại đã được đăng ký.');
      }

      throw error;
    }
  }

  async function login(input: AuthDto.LoginInput): Promise<AuthDto.UserSessionResult> {
    const user = await repository.findUserByEmail(input.email);
    const storedPassword = user?.password ?? dummyHash;
    const validPassword = await verifyPassword(storedPassword, input.password);

    if (!user || !validPassword || user.status !== 'ACTIVE') {
      throw invalidLogin();
    }

    return repository.withUserLock(user.id, (store) => createLoginSession(store, user));
  }

  async function refresh(refreshToken: string): Promise<AuthDto.UserSessionResult> {
    const tokenHash = hashRefreshToken(refreshToken);
    const foundSession = await repository.findSessionByHash(tokenHash);

    if (!foundSession || foundSession.userId === null || foundSession.adminId !== null) {
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

  async function logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const session = await repository.findSessionByHash(tokenHash);

    if (!session || session.userId === null || session.adminId !== null) {
      return;
    }

    const userId = session.userId;
    await repository.withUserLock(userId, async (store) => {
      await store.revokeFamily(userId, session.familyId, new Date());
    });
  }

  async function authenticate(accessToken: string): Promise<AuthDto.UserPrincipal> {
    const { userId, sessionId } = await tokens.verify(accessToken);
    const user = await getCurrentUser(repository, userId, sessionId);
    const profile = toUserOutput(user);

    return { userId, sessionId, profile };
  }

  async function changePassword(principal: AuthDto.UserPrincipal, input: AuthDto.ChangePasswordInput): Promise<void> {
    const { userId, sessionId } = principal;
    const user = await getCurrentUser(repository, userId, sessionId);
    const validPassword = await verifyPassword(user.password, input.currentPassword);

    if (!validPassword) {
      throw new AppError(400, 'Mật khẩu hiện tại không đúng.');
    }

    const password = await hashPassword(input.newPassword);

    await repository.withUserLock(userId, async (store) => {
      const freshUser = await getCurrentUser(store, userId, sessionId);

      if (freshUser.password !== user.password) {
        throw invalidSession();
      }

      await store.changePassword(userId, password);
      await store.revokeAll(userId, new Date());
    });
  }

  async function getCurrentUser(store: UserStore, userId: bigint, sessionId: bigint): Promise<User> {
    const [user, session] = await Promise.all([
      store.findUser(userId),
      store.findSession(sessionId),
    ]);

    if (!user || user.status !== 'ACTIVE') {
      throw invalidSession();
    }

    if (!session || session.userId !== userId || session.adminId !== null) {
      throw invalidSession();
    }

    if (session.revokedAt) {
      throw invalidSession();
    }

    if (session.expiresAt <= new Date()) {
      throw invalidSession();
    }

    return user;
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

    return issueTokens(freshUser, session.id, refreshToken);
  }

  async function rotateRefreshSession(store: UserStore, userId: bigint, sessionId: bigint): Promise<RefreshResult> {
    await store.lockSession(sessionId);
    const session = await store.findSession(sessionId);
    const now = new Date();

    if (!session || session.userId !== userId || session.adminId !== null) {
      return { error: invalidSession() };
    }

    if (session.revokedAt) {
      await store.revokeFamily(userId, session.familyId, now);

      const error = new AppError(401, 'Refresh token đã được sử dụng. Vui lòng đăng nhập lại.', [{ message: 'REFRESH_TOKEN_REUSED' }]);

      return { error };
    }

    if (session.expiresAt <= now) {
      const error = new AppError(401, 'Phiên đã hết hạn. Vui lòng đăng nhập lại.', [{ message: 'REFRESH_TOKEN_EXPIRED' }]);

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
    const value = await issueTokens(user, replacement.id, nextRefreshToken);
    return { value };
  }

  async function issueTokens(user: User, sessionId: bigint, refreshToken: string): Promise<AuthDto.UserSessionResult> {
    const accessToken = await tokens.sign(user.id, sessionId);
    const profile = toUserOutput(user);

    return {
      refreshToken,
      data: {
        accessToken,
        expiresIn: config.USER_ACCESS_TOKEN_TTL_SECONDS,
        user: profile,
      },
    };
  }

  return { register, login, refresh, logout, authenticate, changePassword };
}

export type UserAuthService = Awaited<ReturnType<typeof createUserAuthService>>;
