/**
 * 인메모리 Rate Limit (Vercel Serverless 임시 방어).
 *
 * 주의: 서버리스 인스턴스별 메모리는 공유되지 않으므로
 * 전역적으로 완전한 제한을 보장하지 않는다.
 * Redis/KV 없이 적용하는 임시 방어 수준이다.
 */

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429; message: string };

type Bucket = {
  minute: number[];
  hour: number[];
};

const buckets = new Map<string, Bucket>();

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * 60_000;
const MAX_PER_MINUTE = 5;
const MAX_PER_HOUR = 30;

const RATE_LIMIT_MESSAGE = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

function prune(timestamps: number[], now: number, windowMs: number): number[] {
  return timestamps.filter((t) => now - t < windowMs);
}

/**
 * 동일 clientKey(보통 IP) 기준 1분 5회 / 1시간 30회.
 * AI API 및 인증 시도에 사용한다.
 */
export function checkRateLimit(clientKey: string, now = Date.now()): RateLimitResult {
  const existing = buckets.get(clientKey) ?? { minute: [], hour: [] };
  const minute = prune(existing.minute, now, MINUTE_MS);
  const hour = prune(existing.hour, now, HOUR_MS);

  if (minute.length >= MAX_PER_MINUTE || hour.length >= MAX_PER_HOUR) {
    buckets.set(clientKey, { minute, hour });
    return { ok: false, status: 429, message: RATE_LIMIT_MESSAGE };
  }

  minute.push(now);
  hour.push(now);
  buckets.set(clientKey, { minute, hour });
  return { ok: true };
}

/** 테스트용: 버킷 초기화 */
export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
