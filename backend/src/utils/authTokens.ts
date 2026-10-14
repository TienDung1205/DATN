import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { UserAuthConfig } from '../config/userAuth.js';
import type { AdminAuthConfig } from '../config/adminAuth.js';
import { AppError } from '../errors/appError.js';

const USER_AUDIENCE = 'storefront';
const ADMIN_AUDIENCE = 'backoffice';
const MAX_DATABASE_ID = 9_223_372_036_854_775_807n;

interface TokenIds {
  accountId: bigint;
  sessionId: bigint;
}

interface TokenConfig {
  secret: string;
  issuer: string;
  audience: string;
  accountType: 'user' | 'admin';
  lifetimeSeconds: number;
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

function createTokens(config: TokenConfig) {
  const signingKey = Buffer.from(config.secret, 'utf8');

  function sign(accountId: bigint, sessionId: bigint): Promise<string> {
    const payload = {
      accountType: config.accountType,
      sid: sessionId.toString(),
    };
    const expiresIn = `${config.lifetimeSeconds}s`;
    const token = new SignJWT(payload);

    token.setProtectedHeader({ alg: 'HS256', typ: 'JWT' });
    token.setSubject(accountId.toString());
    token.setIssuer(config.issuer);
    token.setAudience(config.audience);
    token.setIssuedAt();
    token.setExpirationTime(expiresIn);

    return token.sign(signingKey);
  }

  async function verify(token: string): Promise<TokenIds> {
    try {
      const { payload } = await jwtVerify(token, signingKey, {
        algorithms: ['HS256'],
        issuer: config.issuer,
        audience: config.audience,
        typ: 'JWT',
        requiredClaims: ['exp', 'iat', 'sub', 'sid', 'accountType'],
      });

      if (payload.accountType !== config.accountType) {
        throw new Error('Invalid account type');
      }

      const accountId = readDatabaseId(payload.sub);
      const sessionId = readDatabaseId(payload.sid);

      return { accountId, sessionId };
    } catch {
      throw new AppError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
  }

  return { sign, verify };
}

export function createUserTokens(config: UserAuthConfig) {
  const tokens = createTokens({
    secret: config.USER_ACCESS_TOKEN_SECRET,
    issuer: config.AUTH_ISSUER,
    audience: USER_AUDIENCE,
    accountType: 'user',
    lifetimeSeconds: config.USER_ACCESS_TOKEN_TTL_SECONDS,
  });

  async function verify(token: string) {
    const { accountId, sessionId } = await tokens.verify(token);
    return { userId: accountId, sessionId };
  }

  return { sign: tokens.sign, verify };
}

export function createAdminTokens(config: AdminAuthConfig) {
  const tokens = createTokens({
    secret: config.ADMIN_ACCESS_TOKEN_SECRET,
    issuer: config.AUTH_ISSUER,
    audience: ADMIN_AUDIENCE,
    accountType: 'admin',
    lifetimeSeconds: config.ADMIN_ACCESS_TOKEN_TTL_SECONDS,
  });

  async function verify(token: string) {
    const { accountId, sessionId } = await tokens.verify(token);
    return { adminId: accountId, sessionId };
  }

  return { sign: tokens.sign, verify };
}
