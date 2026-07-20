export function ShowcaseFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold text-white">기업대출 RTI 분석 및 상담지원 AI Agent</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed">
          본 프로젝트는 기업대출 상담을 지원하기 위한 업무보조 도구입니다.
          표시되는 계산결과는 입력조건을 기준으로 한 참고용 산출값이며,
          실제 여신심사와 승인 여부는 관련 규정과 심사기준에 따라 결정됩니다.
        </p>
        <p className="mt-4 text-xs text-gray-500">
          KB국민은행 공식 서비스가 아닌 업무 자동화 포트폴리오 프로젝트입니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/showcase#demo"
            className="inline-flex min-h-10 items-center text-sm font-medium text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
          >
            정적 데모로 이동
          </a>
          <a
            href="/"
            className="inline-flex min-h-10 items-center text-sm font-medium text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
          >
            인증 후 실제 Agent 사용
          </a>
        </div>
      </div>
    </footer>
  );
}
