import { FEATURES, FORMULAS } from './showcaseData';

export function FeatureSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-24 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="features-heading" className="text-2xl font-bold text-gray-900">
          핵심 기능
        </h2>
        <p className="mt-2 text-sm text-gray-600">현재 구현되어 실제 사용할 수 있는 기능입니다.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-gray-200 bg-gray-50 p-5 transition-colors hover:border-gold-300 hover:bg-white">
              <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
          <h3 className="text-xl font-bold text-gray-900">AI에게 계산을 맡기지 않은 이유</h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
            <p>
              생성형 AI는 자연어 해석에는 유용하지만,
              중요한 금융 계산에서는 일관성과 재현성이 필요합니다.
            </p>
            <p>
              이 프로젝트는 AI를 조건 추출과 대화에 사용하고,
              최종 숫자는 동일한 입력에 항상 동일한 결과를 내는
              TypeScript 계산함수로 산출합니다.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FORMULAS.map((formula) => (
              <div
                key={formula}
                className="rounded-lg border border-gold-200 bg-white p-4 font-mono text-xs leading-relaxed whitespace-pre-line text-gray-800 sm:text-sm"
              >
                {formula}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            위 산식은 설명용이며, 실제 계산은 프로젝트의 TypeScript 계산엔진이 수행합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
