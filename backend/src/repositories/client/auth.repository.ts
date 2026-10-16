import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { UpdateProfileInput } from '../../dto/client/account.dto.js';

interface CreateUserData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
}

function createQueries(db: Prisma.TransactionClient) {
  function findUser(id: bigint) {
    return db.user.findUnique({ where: { id } });
  }

  function findUserByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  }

  function createUser(data: CreateUserData) {
    return db.user.create({ data });
  }

  function changePassword(id: bigint, password: string) {
    return db.user.update({
      where: { id },
      data: { password },
    });
  }

  function updateProfile(id: bigint, input: UpdateProfileInput) {
    const data: Prisma.UserUpdateInput = {};

    if (input.fullName !== undefined) {
      data.fullName = input.fullName;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone;
    }
    if (input.avatar !== undefined) {
      data.avatar = input.avatar;
    }

    return db.user.update({
      where: { id },
      data,
    });
  }

  function findSession(id: bigint) {
    return db.refreshSession.findUnique({ where: { id } });
  }

  function findSessionByHash(tokenHash: string) {
    return db.refreshSession.findUnique({ where: { tokenHash } });
  }

  function lockSession(id: bigint) {
    return db.$queryRaw`SELECT id FROM refresh_sessions WHERE id = ${id} FOR UPDATE`;
  }

  function createSession(data: Prisma.RefreshSessionUncheckedCreateInput) {
    return db.refreshSession.create({ data });
  }

  function revokeFamily(userId: bigint, familyId: string, now: Date) {
    return db.refreshSession.updateMany({
      where: { userId, adminId: null, familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  function revokeAll(userId: bigint, now: Date) {
    return db.refreshSession.updateMany({
      where: { userId, adminId: null, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  function rotateSession(id: bigint, replacementId: bigint, now: Date) {
    return db.refreshSession.update({
      where: { id },
      data: {
        revokedAt: now,
        lastUsedAt: now,
        replacedBySessionId: replacementId,
      },
    });
  }

  return {
    findUser,
    findUserByEmail,
    createUser,
    changePassword,
    updateProfile,
    findSession,
    findSessionByHash,
    lockSession,
    createSession,
    revokeFamily,
    revokeAll,
    rotateSession,
  };
}

export type UserStore = ReturnType<typeof createQueries>;

export function createUserAuthRepository(client: PrismaClient) {
  const queries = createQueries(client);

  function withTransaction<T>(operation: (store: UserStore) => Promise<T>): Promise<T> {
    return client.$transaction((transaction) => operation(createQueries(transaction)));
  }

  function withUserLock<T>(userId: bigint, operation: (store: UserStore) => Promise<T>): Promise<T> {
    return client.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      const store = createQueries(transaction);
      return operation(store);
    });
  }

  return { ...queries, withTransaction, withUserLock };
}

export type UserAuthRepository = ReturnType<typeof createUserAuthRepository>;
