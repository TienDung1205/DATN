import type { Admin } from '../../generated/prisma/client.js';
import type { AdminOutput } from '../../dto/admin/auth.dto.js';

export function toAdminOutput(admin: Admin): AdminOutput {
  return {
    id: admin.id.toString(),
    email: admin.email,
    fullName: admin.fullName,
    phone: admin.phone,
    status: admin.status,
    role: admin.role,
  };
}
