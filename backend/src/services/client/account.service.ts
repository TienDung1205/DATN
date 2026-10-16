import { Prisma } from '../../generated/prisma/client.js';
import type * as AccountDto from '../../dto/client/account.dto.js';
import type { UserPrincipal } from '../../dto/client/auth.dto.js';
import type { UserAuthRepository, UserStore } from '../../repositories/client/auth.repository.js';
import type { MediaService, StoredImage } from '../shared/media.service.js';
import { AppError } from '../../errors/appError.js';
import { toUserOutput } from '../../mappers/client/auth.mapper.js';
import { invalidSession } from '../../utils/authErrors.js';

export function createUserAccountService(repository: UserAuthRepository, media?: MediaService) {
  async function updateProfile(principal: UserPrincipal, input: AccountDto.UpdateProfileInput, image?: Express.Multer.File): Promise<AccountDto.UpdateProfileOutput> {
    let stored: StoredImage | undefined;
    if (image) {
      if (input.avatar !== undefined) throw new AppError(400, 'Chỉ gửi file image hoặc giá trị avatar, không gửi cả hai.');
      if (!media) throw new AppError(503, 'Dịch vụ lưu ảnh chưa sẵn sàng.');
      await requireCurrentUser(repository, principal);
      stored = await media.uploadAvatar(image.buffer, principal.userId);
    }

    const changes = stored ? { ...input, avatar: stored.url } : input;
    let result;
    try {
      result = await repository.withUserLock(principal.userId, async (store) => {
        const user = await requireCurrentUser(store, principal);
        const hasChanges = Object.entries(changes).some(([key, value]) => value !== undefined && value !== user[key as keyof typeof user]);
        if (!hasChanges) return { profile: toUserOutput(user), removedImage: null };
        const avatarChanged = changes.avatar !== undefined && changes.avatar !== user.avatar;
        const updatedUser = await store.updateProfile(user.id, changes);
        return { profile: toUserOutput(updatedUser), removedImage: avatarChanged ? user.avatar : null };
      });
    } catch (error) {
      if (stored && media) await media.remove(stored.publicId);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'Số điện thoại đã được sử dụng.');
      }

      throw error;
    }

    if (result.removedImage && media) await media.removeAvatar(result.removedImage, principal.userId);
    return result.profile;
  }

  async function requireCurrentUser(store: UserStore, principal: UserPrincipal) {
    const user = await store.findUser(principal.userId);
    const session = await store.findSession(principal.sessionId);

    if (!user || user.status !== 'ACTIVE') throw invalidSession();
    if (!session || session.userId !== user.id || session.adminId !== null) throw invalidSession();
    if (session.revokedAt || session.expiresAt <= new Date()) throw invalidSession();

    return user;
  }

  return { updateProfile };
}

export type UserAccountService = ReturnType<typeof createUserAccountService>;
