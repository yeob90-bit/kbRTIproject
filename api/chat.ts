import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pipeChatStreamToNodeResponse, prepareChatStream } from './_lib/chatAgent.js';
import { gateAiApiRequest, sendAiGateError } from './_lib/aiApiGate.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const MAX_RAW_BODY_CHARS = 100_000;

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

  try {
    const prepared = prepareChatStream(req.body, process.env.GEMINI_API_KEY);
    if (!prepared.ok) {
      sendError(res, prepared.status, prepared.message);
      return;
    }

    pipeChatStreamToNodeResponse(prepared.stream, res);
  } catch (error) {
    console.error('[api/chat]', error);
    if (!res.headersSent) {
      sendError(res, 500, '상담 Agent 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }
}
