import type { User } from '../../generated/prisma/client.js';
import type { RegisterOutput } from '../../dto/client/auth.dto.js';

export function toRegisterOutput(user: User): RegisterOutput {
  return {
    id: user.id.toString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
  };
}
