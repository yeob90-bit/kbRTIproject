import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertAllowedOrigin,
  assertAuthenticated,
  getClientIp,
} from './accessAuth.js';
import { checkRateLimit } from './rateLimit.js';

export type AiApiGateResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/**
 * Gemini를 호출하는 API의 공통 사전 검사.
 * Origin → 인증 쿠키 → Rate Limit 순으로 검사하며, 실패 시 Gemini를 호출하지 않는다.
 */
export function gateAiApiRequest(req: VercelRequest): AiApiGateResult {
  const headers = req.headers as Record<string, string | string[] | undefined>;

  const originCheck = assertAllowedOrigin(headers);
  if (!originCheck.ok) return originCheck;

  const authCheck = assertAuthenticated(headers, process.env.AUTH_SECRET);
  if (!authCheck.ok) return authCheck;

  const clientKey = `ai:${getClientIp(headers, req.socket?.remoteAddress)}`;
  const rate = checkRateLimit(clientKey);
  if (!rate.ok) return rate;

  return { ok: true };
}

export function sendAiGateError(res: VercelResponse, result: Extract<AiApiGateResult, { ok: false }>): void {
  res.status(result.status).json({
    message: result.message,
    error: result.message,
  });
}
