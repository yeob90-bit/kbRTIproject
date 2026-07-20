import { AFTER_IMPROVEMENTS, AFTER_STEPS, BEFORE_ISSUES, BEFORE_STEPS } from './showcaseData';

function FlowList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-2 text-sm text-gray-800">
          <span className="mt-0.5 font-semibold text-gold-700">{index + 1}.</span>
          <span>
            {step}
            {index < steps.length - 1 ? ' →' : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function BeforeAfterSection() {
  return (
    <section id="workflow" aria-labelledby="workflow-heading" className="scroll-mt-24 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="workflow-heading" className="text-2xl font-bold text-gray-900">
          업무 개선
        </h2>
        <p className="mt-2 text-sm text-gray-600">수기 중심 상담 흐름을 AI 조건 추출과 코드 계산으로 바꿉니다.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">Before</h3>
            <FlowList steps={BEFORE_STEPS} />
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">문제점</p>
              <ul className="mt-2 space-y-1.5">
                {BEFORE_ISSUES.map((item) => (
                  <li key={item} className="text-sm text-gray-700">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-xl border border-gold-200 bg-gold-50 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">After</h3>
            <FlowList steps={AFTER_STEPS} />
            <div className="mt-5 border-t border-gold-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-800">개선점</p>
              <ul className="mt-2 space-y-1.5">
                {AFTER_IMPROVEMENTS.map((item) => (
                  <li key={item} className="text-sm text-gray-800">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
