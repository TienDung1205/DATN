import type { Request, Response } from 'express';
import { parseCookie } from 'cookie';
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH } from '../config/adminAuth.js';
import type { AdminAuthConfig } from '../config/adminAuth.js';
import { getAppValue } from './appContext.js';

function cookieOptions(req: Request) {
  const config = getAppValue<AdminAuthConfig>(req.app, 'adminAuthConfig');

  return {
    httpOnly: true,
    secure: config.ADMIN_COOKIE_SECURE,
    sameSite: 'strict' as const,
    path: ADMIN_COOKIE_PATH,
  };
}

export function readToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie ?? '';
  const cookies = parseCookie(cookieHeader);
  const token = cookies[ADMIN_COOKIE];

  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return undefined;
  }

  return token;
}

export function setCookie(req: Request, res: Response, token: string): void {
  const config = getAppValue<AdminAuthConfig>(req.app, 'adminAuthConfig');
  const maxAgeMilliseconds = config.ADMIN_REFRESH_TOKEN_TTL_SECONDS * 1000;

  res.cookie(ADMIN_COOKIE, token, {
    ...cookieOptions(req),
    maxAge: maxAgeMilliseconds,
  });
}

export function clearCookie(req: Request, res: Response): void {
  res.clearCookie(ADMIN_COOKIE, cookieOptions(req));
}
