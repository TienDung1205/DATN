import type { CookieOptions, Request, Response } from 'express';
import { parseCookie } from 'cookie';
import * as authConfig from '../config/auth.js';
import { getAppValue } from './appContext.js';

type AccountType = 'user' | 'admin';

interface CookieSettings {
  name: string;
  path: string;
  secure: boolean;
  lifetimeSeconds: number;
}

export function readToken(req: Request, accountType: AccountType): string | undefined {
  const cookieName = accountType === 'user' ? authConfig.USER_COOKIE : authConfig.ADMIN_COOKIE;
  const cookies = parseCookie(req.headers.cookie ?? '');
  const token = cookies[cookieName];

  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return undefined;
  }

  return token;
}

export function setCookie(req: Request, res: Response, token: string, accountType: AccountType): void {
  const settings = getCookieSettings(req, accountType);

  res.cookie(settings.name, token, {
    ...cookieOptions(settings),
    maxAge: settings.lifetimeSeconds * 1000,
  });
}

export function clearCookie(req: Request, res: Response, accountType: AccountType): void {
  const settings = getCookieSettings(req, accountType);
  res.clearCookie(settings.name, cookieOptions(settings));
}

function cookieOptions(settings: CookieSettings): CookieOptions {
  return {
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'strict',
    path: settings.path,
  };
}

function getCookieSettings(req: Request, accountType: AccountType): CookieSettings {
  if (accountType === 'user') {
    const config = getAppValue<authConfig.UserAuthConfig>(req.app, 'userAuthConfig');

    return {
      name: authConfig.USER_COOKIE,
      path: authConfig.USER_COOKIE_PATH,
      secure: config.USER_COOKIE_SECURE,
      lifetimeSeconds: config.USER_REFRESH_TOKEN_TTL_SECONDS,
    };
  }

  const config = getAppValue<authConfig.AdminAuthConfig>(req.app, 'adminAuthConfig');

  return {
    name: authConfig.ADMIN_COOKIE,
    path: authConfig.ADMIN_COOKIE_PATH,
    secure: config.ADMIN_COOKIE_SECURE,
    lifetimeSeconds: config.ADMIN_REFRESH_TOKEN_TTL_SECONDS,
  };
}
