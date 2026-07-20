import { HERO_FLOW } from './showcaseData';

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-gold-600" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section id="overview" aria-labelledby="hero-heading" className="scroll-mt-24 border-b border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <div>
          <p className="inline-flex rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-800">
            기업금융 업무 자동화 프로젝트
          </p>
          <h1 id="hero-heading" className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            기업대출 RTI 분석 및
            <br />
            상담지원 AI Agent
          </h1>
          <p className="mt-4 text-lg font-medium text-gray-800">
            자연어로 상담하고, 검증 가능한 코드로 계산합니다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            기업대출 상담 과정에서 필요한 RTI와 예상 대출한도를 신속하게 검토할 수 있도록,
            AI 조건 추출과 TypeScript 계산엔진을 결합한 업무지원 도구입니다.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            반복적인 RTI 계산과 상담조건 정리를 자동화하고,
            AI의 역할과 계산엔진의 역할을 분리해 수치 신뢰성을 높였습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-md bg-gold-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
            >
              실제 Agent 체험하기
            </a>
            <a
              href="#architecture"
              className="inline-flex min-h-11 items-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gold-400 hover:bg-gold-50"
            >
              처리 구조 살펴보기
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-gray-900">프로젝트 처리 흐름</p>
          <ol className="mt-4 space-y-3">
            {HERO_FLOW.map((label, index) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                  {label}
                </span>
                {index < HERO_FLOW.length - 1 && (
                  <span className="hidden text-gray-300 sm:inline" aria-hidden="true">
                    <ArrowIcon />
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-xs leading-relaxed text-gold-900">
            AI는 숫자를 직접 계산하지 않습니다. AI는 상담 내용에서 조건을 구조화하고,
            RTI와 대출한도 계산은 검증 가능한 TypeScript 계산엔진이 수행합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
