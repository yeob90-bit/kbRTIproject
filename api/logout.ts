import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertAllowedOrigin, buildClearedSessionCookie, shouldUseSecureCookie } from './_lib/accessAuth.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ message: '허용되지 않은 요청 방식입니다. POST로 요청해 주세요.' });
    return;
  }

  const headers = req.headers as Record<string, string | string[] | undefined>;
  const originCheck = assertAllowedOrigin(headers);
  if (!originCheck.ok) {
    res.status(originCheck.status).json({ message: originCheck.message });
    return;
  }

  res.setHeader('Set-Cookie', buildClearedSessionCookie(shouldUseSecureCookie(headers)));
  res.status(200).json({ ok: true });
}
