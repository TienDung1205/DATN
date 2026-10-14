import { Prisma } from '../../../generated/prisma/client.js';
import type * as AuthDto from '../../../dto/client/auth.dto.js';
import { AppError } from '../../../errors/appError.js';
import type { UserAuthRepository } from '../../../repositories/client/auth.repository.js';
import type { createUserLoginSessions } from './authLogin.service.js';
import { hashPassword } from '../../../utils/password.js';

type CreateLoginSession = ReturnType<typeof createUserLoginSessions>['createLoginSession'];

export function createUserSessions(repository: Pick<UserAuthRepository, 'withTransaction'>, createLoginSession: CreateLoginSession) {
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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          409,
          'Email hoặc số điện thoại đã được đăng ký.',
        );
      }

      throw error;
    }
  }

  return { register };
}
