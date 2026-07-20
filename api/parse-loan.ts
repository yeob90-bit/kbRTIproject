import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseLoanText } from './_lib/parseLoanCore.js';
import { gateAiApiRequest, sendAiGateError } from './_lib/aiApiGate.js';

export const config = {
  runtime: 'nodejs',
};

const MAX_RAW_BODY_CHARS = 20_000;

function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ message, error: message });
}

function estimateBodySize(body: unknown): number {
  try {
    return JSON.stringify(body ?? null).length;
  } catch {
    return MAX_RAW_BODY_CHARS + 1;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.');
    return;
  }

  const gate = gateAiApiRequest(req);
  if (!gate.ok) {
    sendAiGateError(res, gate);
    return;
  }

  if (estimateBodySize(req.body) > MAX_RAW_BODY_CHARS) {
    sendError(res, 413, '요청 본문이 너무 큽니다.');
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
