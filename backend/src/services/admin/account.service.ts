import type * as AccountDto from '../../dto/admin/account.dto.js';
import type { AdminPrincipal } from '../../dto/admin/auth.dto.js';
import type { AdminAuthRepository } from '../../repositories/admin/auth.repository.js';
import { toAdminOutput } from '../../mappers/admin/auth.mapper.js';
import { invalidSession } from '../../utils/authErrors.js';

export function createAdminAccountService(repository: AdminAuthRepository) {
  async function updateProfile(principal: AdminPrincipal, input: AccountDto.UpdateProfileInput): Promise<AccountDto.UpdateProfileOutput> {
    return repository.withAdminLock(principal.adminId, async (store) => {
      const admin = await store.findAdmin(principal.adminId);
      const session = await store.findSession(principal.sessionId);

      if (!admin || admin.status !== 'ACTIVE') throw invalidSession();
      if (!session || session.adminId !== admin.id || session.userId !== null) throw invalidSession();
      if (session.revokedAt || session.expiresAt <= new Date()) throw invalidSession();

      const nameChanged = input.fullName !== undefined && input.fullName !== admin.fullName;
      const phoneChanged = input.phone !== undefined && input.phone !== admin.phone;

      if (!nameChanged && !phoneChanged) return toAdminOutput(admin);

      const updatedAdmin = await store.updateProfile(admin.id, input);
      return toAdminOutput(updatedAdmin);
    });
  }

  return { updateProfile };
}

export type AdminAccountService = ReturnType<typeof createAdminAccountService>;
