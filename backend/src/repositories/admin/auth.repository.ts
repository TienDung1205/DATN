import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';

function createQueries(db: Prisma.TransactionClient) {
  function findAdmin(id: bigint) {
    return db.admin.findUnique({ where: { id } });
  }

  function findAdminByEmail(email: string) {
    return db.admin.findUnique({ where: { email } });
  }

  function changePassword(id: bigint, password: string) {
    return db.admin.update({
      where: { id },
      data: { password },
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

  function revokeFamily(adminId: bigint, familyId: string, now: Date) {
    return db.refreshSession.updateMany({
      where: { adminId, userId: null, familyId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  function revokeAll(adminId: bigint, now: Date) {
    return db.refreshSession.updateMany({
      where: { adminId, userId: null, revokedAt: null },
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
    findAdmin,
    findAdminByEmail,
    changePassword,
    findSession,
    findSessionByHash,
    lockSession,
    createSession,
    revokeFamily,
    revokeAll,
    rotateSession,
  };
}

export type AdminStore = ReturnType<typeof createQueries>;

export function createAdminAuthRepository(client: PrismaClient) {
  const queries = createQueries(client);

  function withAdminLock<T>(adminId: bigint, operation: (store: AdminStore) => Promise<T>): Promise<T> {
    return client.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM admins WHERE id = ${adminId} FOR UPDATE`;

      const store = createQueries(transaction);
      return operation(store);
    });
  }

  return { ...queries, withAdminLock };
}

export type AdminAuthRepository = ReturnType<typeof createAdminAuthRepository>;
