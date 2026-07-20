import { Suspense, use, useState } from 'react';
import App from '../App';
import { AccessGate } from '../components/auth/AccessGate';

type AuthResult = 'authenticated' | 'guest';

function fetchAuthStatus(): Promise<AuthResult> {
  return fetch('/api/auth', { credentials: 'include' })
    .then(async (response) => {
      const body = (await response.json().catch(() => ({}))) as { authenticated?: boolean };
      return response.ok && body.authenticated ? 'authenticated' : 'guest';
    })
    .catch(() => 'guest' as const);
}

function AuthContent({
  authPromise,
  onAuthenticated,
  onLogout,
}: {
  authPromise: Promise<AuthResult>;
  onAuthenticated: () => void;
  onLogout: () => void;
}) {
  const status = use(authPromise);

  if (status === 'guest') {
    return <AccessGate onAuthenticated={onAuthenticated} />;
  }

  return <App onLogout={onLogout} />;
}

export default function AuthenticatedApp() {
  const [authPromise, setAuthPromise] = useState(() => fetchAuthStatus());

  function markAuthenticated() {
    // 로그인 POST 성공 직후 쿠키 race를 피하기 위해 상태를 즉시 반영한다.
    setAuthPromise(Promise.resolve('authenticated'));
  }

  async function handleLogout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
    } catch {
      // 네트워크 오류여도 세션 UI는 게스트로 전환
    }
    setAuthPromise(Promise.resolve('guest'));
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 text-sm text-gray-600">
          인증 상태 확인 중...
        </div>
      }
    >
      <AuthContent
        authPromise={authPromise}
        onAuthenticated={markAuthenticated}
        onLogout={() => void handleLogout()}
      />
    </Suspense>
  );
}
