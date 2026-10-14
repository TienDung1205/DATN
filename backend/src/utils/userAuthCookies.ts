import type { Request, Response } from 'express';
import { parseCookie } from 'cookie';
import { USER_COOKIE, USER_COOKIE_PATH } from '../config/userAuth.js';
import type { UserAuthConfig } from '../config/userAuth.js';
import { getAppValue } from './appContext.js';

function cookieOptions(req: Request) {
  const config = getAppValue<UserAuthConfig>(req.app, 'userAuthConfig');

  return {
    httpOnly: true,
    secure: config.USER_COOKIE_SECURE,
    sameSite: 'strict' as const,
    path: USER_COOKIE_PATH,
  };
}

export function readToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie ?? '';
  const cookies = parseCookie(cookieHeader);
  const token = cookies[USER_COOKIE];

  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return undefined;
  }

  return token;
}

export function setCookie(req: Request, res: Response, token: string): void {
  const config = getAppValue<UserAuthConfig>(req.app, 'userAuthConfig');
  const maxAgeMilliseconds = config.USER_REFRESH_TOKEN_TTL_SECONDS * 1000;

  res.cookie(USER_COOKIE, token, {
    ...cookieOptions(req),
    maxAge: maxAgeMilliseconds,
  });
}

export function clearCookie(req: Request, res: Response): void {
  res.clearCookie(USER_COOKIE, cookieOptions(req));
}
