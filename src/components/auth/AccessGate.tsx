import { useState, type FormEvent } from 'react';

interface AccessGateProps {
  onAuthenticated: () => void;
}

export function AccessGate({ onAuthenticated }: AccessGateProps) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      const body = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        setError(body.message ?? 'Access Code가 올바르지 않습니다.');
        return;
      }

      setAccessCode('');
      onAuthenticated();
    } catch {
      setError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-gold-700">비공개 Agent 영역</p>
        <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">기업대출 RTI 분석 AI Agent</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          실제 AI Agent와 Gemini 자연어 분석은 Access Code 인증 후 사용할 수 있습니다.
          공개 소개와 정적 계산 데모는 Showcase에서 이용할 수 있습니다.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="access-code" className="block text-sm font-medium text-gray-800">
              Access Code
            </label>
            <input
              id="access-code"
              name="accessCode"
              type="password"
              autoComplete="current-password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="Access Code 입력"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || accessCode.trim().length === 0}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-gold-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '확인 중...' : '입장'}
          </button>
        </form>

        <a
          href="/showcase"
          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gold-400 hover:bg-gold-50"
        >
          공개 Showcase로 이동
        </a>
      </div>
    </div>
  );
}
