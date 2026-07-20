import { ROADMAP_ITEMS } from './showcaseData';

export function RoadmapSection() {
  return (
    <section id="roadmap" aria-labelledby="roadmap-heading" className="scroll-mt-24 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="roadmap-heading" className="text-2xl font-bold text-gray-900">
          향후 계획
        </h2>
        <p className="mt-2 text-sm text-gray-600">아직 구현되지 않은 확장 방향입니다.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP_ITEMS.map((item, index) => (
            <article key={item} className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">계획 {index + 1}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-800">{item}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm font-medium text-gold-800">
          위 기능은 현재 구현 기능이 아니라 향후 확장 계획입니다.
        </p>
      </div>
    </section>
  );
}
