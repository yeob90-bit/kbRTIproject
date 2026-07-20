import { METRICS, PROBLEMS } from './showcaseData';

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-heading" className="scroll-mt-24 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {METRICS.map((metric) => (
            <article key={metric.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gold-800">{metric.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{metric.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <h2 id="problem-heading" className="text-2xl font-bold text-gray-900">
            왜 이 프로젝트를 만들었나
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            기업대출 상담 현장에서 반복되는 입력·계산·정리 업무를 줄이고,
            수치 신뢰성을 확보하기 위해 만들었습니다.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((problem, index) => (
              <article key={problem} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gold-700">문제 {index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-800">{problem}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
