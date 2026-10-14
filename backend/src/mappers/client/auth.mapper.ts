import type { User } from '../../generated/prisma/client.js';
import type { UserOutput } from '../../dto/client/auth.dto.js';

export function toUserOutput(user: User): UserOutput {
  return {
    id: user.id.toString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatar: user.avatar,
    status: user.status,
  };
}
