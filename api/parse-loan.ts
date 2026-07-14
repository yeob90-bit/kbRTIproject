import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseLoanText } from './_lib/parseLoanCore.js';

export const config = {
  runtime: 'nodejs',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestLog = new Map<string, number[]>();

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(clientKey) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(clientKey, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientKey(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0]!.trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0]!;
  return req.socket?.remoteAddress ?? 'unknown';
}

function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ message });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.');
    return;
  }

  const clientKey = getClientKey(req);
  if (isRateLimited(clientKey)) {
    sendError(res, 429, '짧은 시간 내 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const body = req.body as unknown;
  const text = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).text : undefined;

  const result = await parseLoanText(typeof text === 'string' ? text : '', process.env.GEMINI_API_KEY);
  if (!result.ok) {
    sendError(res, result.status, result.message);
    return;
  }

  res.status(200).json(result.data);
}
