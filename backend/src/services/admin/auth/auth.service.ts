import { randomUUID } from 'node:crypto';
import type { Admin } from '../../../generated/prisma/client.js';
import type { AdminAuthConfig } from '../../../config/auth.js';
import type * as AuthDto from '../../../dto/admin/auth.dto.js';
import type { AdminAuthRepository, AdminStore } from '../../../repositories/admin/auth.repository.js';
import { AppError } from '../../../errors/appError.js';
import { toAdminOutput } from '../../../mappers/admin/auth.mapper.js';
import { createAdminTokens, hashRefreshToken, newRefreshToken } from '../../../utils/authTokens.js';
import { hashPassword, verifyPassword } from '../../../utils/password.js';
import { invalidLogin, invalidSession } from '../../../utils/authErrors.js';

type RefreshResult = { value: AuthDto.AdminSessionResult } | { error: AppError };

export async function createAdminAuthService(repository: AdminAuthRepository, config: AdminAuthConfig) {
  const tokens = createAdminTokens(config);
  const dummyHash = await hashPassword(newRefreshToken());

  async function login(input: AuthDto.LoginInput): Promise<AuthDto.AdminSessionResult> {
    const admin = await repository.findAdminByEmail(input.email);
    const storedPassword = admin?.password ?? dummyHash;
    const validPassword = await verifyPassword(storedPassword, input.password);

    if (!admin || !validPassword || admin.status !== 'ACTIVE') {
      throw invalidLogin();
    }

    return repository.withAdminLock(admin.id, (store) => createLoginSession(store, admin));
  }

  async function refresh(refreshToken: string): Promise<AuthDto.AdminSessionResult> {
    const tokenHash = hashRefreshToken(refreshToken);
    const foundSession = await repository.findSessionByHash(tokenHash);

    if (!foundSession || foundSession.adminId === null || foundSession.userId !== null) {
      throw invalidSession();
    }

    const adminId = foundSession.adminId;
    const sessionId = foundSession.id;
    const result = await repository.withAdminLock(adminId, (store) => rotateRefreshSession(store, adminId, sessionId));

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

    if (!session || session.adminId === null || session.userId !== null) {
      return;
    }

    const adminId = session.adminId;
    await repository.withAdminLock(adminId, async (store) => {
      await store.revokeFamily(adminId, session.familyId, new Date());
    });
  }

  async function authenticate(accessToken: string): Promise<AuthDto.AdminPrincipal> {
    const { adminId, sessionId } = await tokens.verify(accessToken);
    const admin = await getCurrentAdmin(repository, adminId, sessionId);
    const profile = toAdminOutput(admin);

    return { adminId, sessionId, profile };
  }

  async function changePassword(principal: AuthDto.AdminPrincipal, input: AuthDto.ChangePasswordInput): Promise<void> {
    const { adminId, sessionId } = principal;
    const admin = await getCurrentAdmin(repository, adminId, sessionId);
    const validPassword = await verifyPassword(admin.password, input.currentPassword);

    if (!validPassword) {
      throw new AppError(400, 'Mật khẩu hiện tại không đúng.');
    }

    const password = await hashPassword(input.newPassword);

    await repository.withAdminLock(adminId, async (store) => {
      const freshAdmin = await getCurrentAdmin(store, adminId, sessionId);

      if (freshAdmin.password !== admin.password) {
        throw invalidSession();
      }

      await store.changePassword(adminId, password);
      await store.revokeAll(adminId, new Date());
    });
  }

  async function getCurrentAdmin(store: AdminStore, adminId: bigint, sessionId: bigint): Promise<Admin> {
    const [admin, session] = await Promise.all([
      store.findAdmin(adminId),
      store.findSession(sessionId),
    ]);

    if (!admin || admin.status !== 'ACTIVE') {
      throw invalidSession();
    }
    if (!session || session.adminId !== adminId || session.userId !== null) {
      throw invalidSession();
    }
    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw invalidSession();
    }

    return admin;
  }

  async function createLoginSession(store: AdminStore, admin: Admin): Promise<AuthDto.AdminSessionResult> {
    const freshAdmin = await store.findAdmin(admin.id);

    if (!freshAdmin || freshAdmin.status !== 'ACTIVE') {
      throw invalidLogin();
    }

    if (freshAdmin.password !== admin.password) {
      throw invalidLogin();
    }

    const refreshToken = newRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const lifetimeMilliseconds = config.ADMIN_REFRESH_TOKEN_TTL_SECONDS * 1000;
    const expiresAt = new Date(Date.now() + lifetimeMilliseconds);

    const session = await store.createSession({
      adminId: admin.id,
      familyId: randomUUID(),
      tokenHash,
      expiresAt,
    });

    return issueTokens(freshAdmin, session.id, refreshToken);
  }

  async function rotateRefreshSession(store: AdminStore, adminId: bigint, sessionId: bigint): Promise<RefreshResult> {
    await store.lockSession(sessionId);
    const session = await store.findSession(sessionId);
    const now = new Date();

    if (!session || session.adminId !== adminId || session.userId !== null) {
      return { error: invalidSession() };
    }

    if (session.revokedAt) {
      await store.revokeFamily(adminId, session.familyId, now);

      const error = new AppError(401, 'Refresh token đã được sử dụng. Vui lòng đăng nhập lại.', [{ message: 'REFRESH_TOKEN_REUSED' }]);

      return { error };
    }

    if (session.expiresAt <= now) {
      const error = new AppError(401, 'Phiên đã hết hạn. Vui lòng đăng nhập lại.', [{ message: 'REFRESH_TOKEN_EXPIRED' }]);

      return { error };
    }

    const admin = await store.findAdmin(adminId);

    if (!admin || admin.status !== 'ACTIVE') {
      await store.revokeAll(adminId, now);
      return { error: invalidSession() };
    }

    const nextRefreshToken = newRefreshToken();
    const nextTokenHash = hashRefreshToken(nextRefreshToken);

    const replacement = await store.createSession({
      adminId,
      familyId: session.familyId,
      tokenHash: nextTokenHash,
      expiresAt: session.expiresAt,
    });

    await store.rotateSession(session.id, replacement.id, now);
    const value = await issueTokens(admin, replacement.id, nextRefreshToken);
    return { value };
  }

  async function issueTokens(admin: Admin, sessionId: bigint, refreshToken: string): Promise<AuthDto.AdminSessionResult> {
    const accessToken = await tokens.sign(admin.id, sessionId);
    const profile = toAdminOutput(admin);

    return {
      refreshToken,
      data: {
        accessToken,
        expiresIn: config.ADMIN_ACCESS_TOKEN_TTL_SECONDS,
        admin: profile,
      },
    };
  }

  return { login, refresh, logout, authenticate, changePassword };
}

export type AdminAuthService = Awaited<ReturnType<typeof createAdminAuthService>>;
