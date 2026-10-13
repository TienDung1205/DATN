import type { PrismaClient } from '../../generated/prisma/client.js';

export function createUserAuthRepository(client: PrismaClient) {
  return {
    createUser: (data: {
      email: string;
      phone: string;
      password: string;
      fullName: string;
    }) => client.user.create({ data }),
  };
}

export type UserAuthRepository = ReturnType<typeof createUserAuthRepository>;
