import type { User } from '../../../generated/prisma/client.js';
import type { UserAuthConfig } from '../../../config/userAuth.js';
import type { UserSessionResult } from '../../../dto/client/auth.dto.js';
import type { UserStore } from '../../../repositories/client/auth.repository.js';
import { toRegisterOutput } from '../../../mappers/client/auth.mapper.js';
import { createUserTokens, newRefreshToken } from '../../../utils/authTokens.js';
import { hashPassword } from '../../../utils/password.js';
import { invalidSession } from '../../../utils/userAuthErrors.js';

export async function createUserAccess(config: UserAuthConfig) {
  const tokens = createUserTokens(config);
  const dummyHash = await hashPassword(newRefreshToken());

  async function getCurrentUser(store: UserStore, userId: bigint, sessionId: bigint): Promise<User> {
    const [user, session] = await Promise.all([
      store.findUser(userId),
      store.findSession(sessionId),
    ]);

    if (!user || user.status !== 'ACTIVE') {
      throw invalidSession();
    }

    if (!session || session.userId !== userId) {
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

  async function issueTokens(user: User, sessionId: bigint, refreshToken: string): Promise<UserSessionResult> {
    const accessToken = await tokens.sign(user.id, sessionId);
    const profile = toRegisterOutput(user);

    return {
      refreshToken,
      data: {
        accessToken,
        expiresIn: config.USER_ACCESS_TOKEN_TTL_SECONDS,
        user: profile,
      },
    };
  }

  return { tokens, dummyHash, getCurrentUser, issueTokens };
}

export type UserAccess = Awaited<ReturnType<typeof createUserAccess>>;
