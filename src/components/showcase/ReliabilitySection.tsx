import { CALC_STABILITY, PRIVACY_POINTS } from './showcaseData';

export function ReliabilitySection() {
  return (
    <section id="reliability" aria-labelledby="reliability-heading" className="scroll-mt-24 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="reliability-heading" className="text-2xl font-bold text-gray-900">
          안정성과 개인정보 보호
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          개인정보 입력 위험을 줄이기 위한 사전 보호장치를 적용했습니다.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">계산 안정성</h3>
            <ul className="mt-4 space-y-2">
              {CALC_STABILITY.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">개인정보 보호</h3>
            <ul className="mt-4 space-y-2">
              {PRIVACY_POINTS.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
