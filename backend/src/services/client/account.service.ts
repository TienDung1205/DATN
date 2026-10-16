import { Prisma } from '../../generated/prisma/client.js';
import type * as AccountDto from '../../dto/client/account.dto.js';
import type { UserPrincipal } from '../../dto/client/auth.dto.js';
import type { UserAuthRepository } from '../../repositories/client/auth.repository.js';
import { AppError } from '../../errors/appError.js';
import { toUserOutput } from '../../mappers/client/auth.mapper.js';
import { invalidSession } from '../../utils/authErrors.js';

export function createUserAccountService(repository: UserAuthRepository) {
  async function updateProfile(principal: UserPrincipal, input: AccountDto.UpdateProfileInput): Promise<AccountDto.UpdateProfileOutput> {
    try {
      return await repository.withUserLock(principal.userId, async (store) => {
        const user = await store.findUser(principal.userId);
        const session = await store.findSession(principal.sessionId);

        if (!user || user.status !== 'ACTIVE') {
          throw invalidSession();
        }

        if (!session || session.userId !== user.id || session.adminId !== null) {
          throw invalidSession();
        }

        if (session.revokedAt || session.expiresAt <= new Date()) {
          throw invalidSession();
        }

        const updatedUser = await store.updateProfile(user.id, input);
        return toUserOutput(updatedUser);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'Số điện thoại đã được sử dụng.');
      }

      throw error;
    }
  }

  return { updateProfile };
}

export type UserAccountService = ReturnType<typeof createUserAccountService>;
