import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pipeChatStreamToNodeResponse, prepareChatStream } from './_lib/chatAgent.js';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ message });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendError(res, 405, '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.');
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
