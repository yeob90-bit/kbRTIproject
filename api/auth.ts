import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertAllowedOrigin,
  buildSessionCookie,
  createSessionToken,
  getClientIp,
  getSessionTokenFromCookieHeader,
  shouldUseSecureCookie,
  verifyAccessCode,
  verifySessionToken,
} from './_lib/accessAuth.js';
import { checkRateLimit } from './_lib/rateLimit.js';

export const config = {
  runtime: 'nodejs',
};

const MAX_ACCESS_CODE_LENGTH = 200;

function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const headers = req.headers as Record<string, string | string[] | undefined>;

  if (req.method === 'GET') {
    const originCheck = assertAllowedOrigin(headers);
    if (!originCheck.ok) {
      sendJson(res, originCheck.status, { authenticated: false, message: originCheck.message });
      return;
    }

    const cookieHeader = typeof headers.cookie === 'string' ? headers.cookie : undefined;
    const token = getSessionTokenFromCookieHeader(cookieHeader);
    const authenticated = verifySessionToken(token, process.env.AUTH_SECRET);
    sendJson(res, 200, { authenticated });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' });
    return;
  }

  const originCheck = assertAllowedOrigin(headers);
  if (!originCheck.ok) {
    sendJson(res, originCheck.status, { message: originCheck.message });
    return;
  }

  const clientKey = `auth:${getClientIp(headers, req.socket?.remoteAddress)}`;
  const rate = checkRateLimit(clientKey);
  if (!rate.ok) {
    sendJson(res, rate.status, { message: rate.message });
    return;
  }

  const body = req.body as unknown;
  const accessCode =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).accessCode : undefined;

  if (typeof accessCode !== 'string' || accessCode.trim().length === 0) {
    sendJson(res, 400, { message: 'Access Code를 입력해 주세요.' });
    return;
  }

  if (accessCode.length > MAX_ACCESS_CODE_LENGTH) {
    sendJson(res, 400, { message: 'Access Code 형식이 올바르지 않습니다.' });
    return;
  }

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    console.error('[api/auth] AUTH_SECRET이 설정되지 않았거나 너무 짧습니다.');
    sendJson(res, 500, { message: '서버 인증 설정 오류입니다. 관리자에게 문의해 주세요.' });
    return;
  }

  if (!verifyAccessCode(accessCode, process.env.ACCESS_CODE)) {
    sendJson(res, 401, { message: 'Access Code가 올바르지 않습니다.' });
    return;
  }

  try {
    const token = createSessionToken(process.env.AUTH_SECRET);
    const secure = shouldUseSecureCookie(headers);
    res.setHeader('Set-Cookie', buildSessionCookie(token, secure));
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[api/auth]', error);
    sendJson(res, 500, { message: '인증 처리 중 오류가 발생했습니다.' });
  }
}
