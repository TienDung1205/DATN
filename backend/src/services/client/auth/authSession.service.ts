import { Prisma } from '../../../generated/prisma/client.js';
import type { RegisterInput, RegisterOutput } from '../../../dto/client/auth.dto.js';
import { toRegisterOutput } from '../../../mappers/client/auth.mapper.js';
import { AppError } from '../../../errors/appError.js';
import type { UserAuthRepository } from '../../../repositories/client/auth.repository.js';
import { hashPassword } from '../../../utils/password.js';

export function createUserSessions(repository: Pick<UserAuthRepository, 'createUser'>) {
  async function register(input: RegisterInput): Promise<RegisterOutput> {
    const password = await hashPassword(input.password);

    try {
      const user = await repository.createUser({
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        password,
      });

      return toRegisterOutput(user);
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
