import { describe, expect, it, beforeEach } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  verifyAccessCode,
  isOriginAllowed,
  buildSessionCookie,
  SESSION_COOKIE_NAME,
  assertAllowedOrigin,
} from './accessAuth.js';
import { checkRateLimit, resetRateLimitBucketsForTests } from './rateLimit.js';

describe('accessAuth', () => {
  const secret = 'test-auth-secret-32chars-minimum!!';

  it('올바른 Access Code만 통과한다', () => {
    expect(verifyAccessCode('secret-code', 'secret-code')).toBe(true);
    expect(verifyAccessCode('wrong', 'secret-code')).toBe(false);
    expect(verifyAccessCode('', 'secret-code')).toBe(false);
    expect(verifyAccessCode('secret-code', undefined)).toBe(false);
  });

  it('서명된 세션 토큰을 발급·검증한다', () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, secret)).toBe(true);
    expect(verifySessionToken(token, 'other-secret-32chars-minimum!!!!')).toBe(false);
    expect(verifySessionToken('tampered.token', secret)).toBe(false);
    expect(verifySessionToken(undefined, secret)).toBe(false);
  });

  it('만료된 세션 토큰은 거부한다', () => {
    const token = createSessionToken(secret, Date.now() - 9 * 60 * 60 * 1000);
    expect(verifySessionToken(token, secret)).toBe(false);
  });

  it('허용 Origin만 통과한다', () => {
    expect(isOriginAllowed('https://kb-rti-agent.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://kb-rti-ai-agent.vercel.app')).toBe(true);
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('https://evil.example')).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(false);
  });

  it('앞뒤 공백이 있는 Access Code도 허용한다', () => {
    expect(verifyAccessCode('  secret-code  ', 'secret-code')).toBe(true);
  });

  it('세션 쿠키에 HttpOnly와 SameSite가 포함된다', () => {
    const cookie = buildSessionCookie('abc.token', true);
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
  });

  it('Origin이 없어도 허용 Host면 통과한다', () => {
    const result = assertAllowedOrigin({ host: 'kb-rti-agent.vercel.app' });
    expect(result.ok).toBe(true);
  });
});

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests();
  });

  it('1분 5회를 초과하면 429를 반환한다', () => {
    const key = 'test-ip';
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit(key).ok).toBe(true);
    }
    const limited = checkRateLimit(key);
    expect(limited.ok).toBe(false);
    if (!limited.ok) {
      expect(limited.status).toBe(429);
      expect(limited.message).toContain('요청이 너무 많습니다');
    }
  });
});
