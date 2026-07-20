import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'kb_rti_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8시간

const PRODUCTION_ORIGINS = [
  'https://kb-rti-agent.vercel.app',
  'https://kb-rti-ai-agent.vercel.app',
] as const;
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'] as const;

export const ALLOWED_ORIGINS = [...PRODUCTION_ORIGINS, ...DEV_ORIGINS] as const;

const ALLOWED_HOSTS = [
  'kb-rti-agent.vercel.app',
  'kb-rti-ai-agent.vercel.app',
  'localhost:5173',
  'localhost:5174',
] as const;

export type GuardFailure = {
  ok: false;
  status: number;
  message: string;
};

export type GuardSuccess = { ok: true };

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return undefined;
}

export function getClientIp(headers: Record<string, string | string[] | undefined>, remoteAddress?: string): string {
  const forwarded = getHeaderValue(headers['x-forwarded-for']);
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return remoteAddress ?? 'unknown';
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

export function isHostAllowed(host: string | undefined): boolean {
  if (!host) return false;
  return (ALLOWED_HOSTS as readonly string[]).includes(host);
}

/**
 * Origin 검사는 보조 수단이다. 인증 쿠키 검증을 대체하지 않는다.
 * 같은 사이트 GET(세션 확인)처럼 Origin이 없는 요청은 Host로 보조 확인한다.
 */
export function assertAllowedOrigin(headers: Record<string, string | string[] | undefined>): GuardSuccess | GuardFailure {
  const origin = getHeaderValue(headers.origin);
  if (isOriginAllowed(origin)) {
    return { ok: true };
  }

  // same-origin GET 등 Origin 미포함 요청
  if (!origin && isHostAllowed(getHeaderValue(headers.host))) {
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    message: '허용되지 않은 요청 Origin입니다.',
  };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

function safeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // 길이 불일치 시에도 상수시간에 가까운 비교를 유지하기 위해 더미 비교
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyAccessCode(input: string, expected: string | undefined): boolean {
  if (!expected || expected.length === 0) return false;
  if (typeof input !== 'string' || input.length === 0) return false;
  const normalizedInput = input.trim();
  const normalizedExpected = expected.trim();
  if (normalizedInput.length === 0 || normalizedExpected.length === 0) return false;
  return safeEqualString(normalizedInput, normalizedExpected);
}

type SessionPayload = {
  v: 1;
  iat: number;
  exp: number;
  nonce: string;
};

export function createSessionToken(secret: string, now = Date.now()): string {
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET이 설정되지 않았거나 너무 짧습니다.');
  }

  const payload: SessionPayload = {
    v: 1,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SEC,
    nonce: randomBytes(16).toString('hex'),
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!token || !secret || secret.length < 16) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return false;

  const expectedSig = signPayload(payloadB64, secret);
  if (!safeEqualString(signature, expectedSig)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8')) as SessionPayload;
    if (payload.v !== 1) return false;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < now) return false;
    if (typeof payload.iat !== 'number') return false;
    return true;
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function getSessionTokenFromCookieHeader(cookieHeader: string | undefined): string | undefined {
  return parseCookies(cookieHeader)[SESSION_COOKIE_NAME];
}

export function buildSessionCookie(token: string, isSecure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearedSessionCookie(isSecure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

export function shouldUseSecureCookie(headers: Record<string, string | string[] | undefined>): boolean {
  const forwardedProto = getHeaderValue(headers['x-forwarded-proto']);
  if (forwardedProto === 'https') return true;
  const host = getHeaderValue(headers.host) ?? '';
  return host.includes('vercel.app') || host.endsWith(':443');
}

export function assertAuthenticated(
  headers: Record<string, string | string[] | undefined>,
  authSecret: string | undefined,
): GuardSuccess | GuardFailure {
  const cookieHeader = getHeaderValue(headers.cookie);
  const token = getSessionTokenFromCookieHeader(cookieHeader);
  if (!verifySessionToken(token, authSecret)) {
    return {
      ok: false,
      status: 401,
      message: '인증이 필요합니다. Access Code로 로그인해 주세요.',
    };
  }
  return { ok: true };
}
