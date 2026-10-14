import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { UserAuthConfig } from '../config/userAuth.js';
import { AppError } from '../errors/appError.js';

const USER_AUDIENCE = 'storefront';
const MAX_DATABASE_ID = 9_223_372_036_854_775_807n;

interface UserTokenIds {
  userId: bigint;
  sessionId: bigint;
}

export function newRefreshToken(): string {
  const bytes = randomBytes(32);
  return bytes.toString('base64url');
}

export function hashRefreshToken(token: string): string {
  const hash = createHash('sha256');
  hash.update(token);

  return hash.digest('hex');
}

function readDatabaseId(value: unknown): bigint {
  if (typeof value !== 'string') {
    throw new Error('Database ID must be a string');
  }

  if (!/^[1-9]\d{0,18}$/.test(value)) {
    throw new Error('Invalid database ID format');
  }

  const id = BigInt(value);

  if (id > MAX_DATABASE_ID) {
    throw new Error('Database ID is out of range');
  }

  return id;
}

export function createUserTokens(config: UserAuthConfig) {
  const signingKey = Buffer.from(config.USER_ACCESS_TOKEN_SECRET, 'utf8');

  function sign(userId: bigint, sessionId: bigint): Promise<string> {
    const payload = {
      accountType: 'user',
      sid: sessionId.toString(),
    };
    const expiresIn = `${config.USER_ACCESS_TOKEN_TTL_SECONDS}s`;
    const token = new SignJWT(payload);

    token.setProtectedHeader({ alg: 'HS256', typ: 'JWT' });
    token.setSubject(userId.toString());
    token.setIssuer(config.AUTH_ISSUER);
    token.setAudience(USER_AUDIENCE);
    token.setIssuedAt();
    token.setExpirationTime(expiresIn);

    return token.sign(signingKey);
  }

  async function verify(token: string): Promise<UserTokenIds> {
    try {
      const { payload } = await jwtVerify(token, signingKey, {
        algorithms: ['HS256'],
        issuer: config.AUTH_ISSUER,
        audience: USER_AUDIENCE,
        typ: 'JWT',
        requiredClaims: ['exp', 'iat', 'sub', 'sid', 'accountType'],
      });

      if (payload.accountType !== 'user') {
        throw new Error('Invalid account type');
      }

      const userId = readDatabaseId(payload.sub);
      const sessionId = readDatabaseId(payload.sid);

      return { userId, sessionId };
    } catch {
      throw new AppError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
  }

  return { sign, verify };
}
