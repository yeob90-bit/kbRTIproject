import { PIPELINE_STEPS, TECH_FLOW } from './showcaseData';

export function ArchitectureSection() {
  return (
    <section id="architecture" aria-labelledby="architecture-heading" className="scroll-mt-24 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="architecture-heading" className="text-2xl font-bold text-gray-900">
          처리 구조
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Gemini는 조건을 구조화하고, RTI·대출한도 숫자는 TypeScript 계산엔진이 산출합니다.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STEPS.map((item) => (
            <li key={item.step} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-gold-700">STEP {item.step}</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">기술 흐름</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {TECH_FLOW.map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                  {label}
                </span>
                {index < TECH_FLOW.length - 1 && (
                  <span className="text-gold-600" aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            Gemini는 RTI를 직접 계산하지 않습니다. 조건 추출과 대화 지원만 담당합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
