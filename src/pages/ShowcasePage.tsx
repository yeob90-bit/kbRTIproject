import { useEffect } from 'react';
import { ArchitectureSection } from '../components/showcase/ArchitectureSection';
import { BeforeAfterSection } from '../components/showcase/BeforeAfterSection';
import { FeatureSection } from '../components/showcase/FeatureSection';
import { HeroSection } from '../components/showcase/HeroSection';
import { ProblemSection } from '../components/showcase/ProblemSection';
import { ReliabilitySection } from '../components/showcase/ReliabilitySection';
import { RoadmapSection } from '../components/showcase/RoadmapSection';
import { ShowcaseFooter } from '../components/showcase/ShowcaseFooter';
import { ShowcaseHeader } from '../components/showcase/ShowcaseHeader';

function ExperienceCta() {
  return (
    <section aria-labelledby="cta-heading" className="border-b border-gray-200 bg-gold-50">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:py-14">
        <h2 id="cta-heading" className="text-2xl font-bold text-gray-900">
          설명보다 직접 확인해보세요
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-700">
          상담형 Agent, 자연어 조건 추출, 수동 입력,
          RTI 계산과 월세별 예상 대출금액을 직접 확인할 수 있습니다.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
        >
          기업대출 RTI Agent 실행하기
        </a>
      </div>
    </section>
  );
}

export default function ShowcasePage() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = previous;
    };
  }, []);

  return (
    <div className="showcase-root min-h-screen bg-white text-gray-900 antialiased">
      <ShowcaseHeader />
      <main>
        <HeroSection />
        <ProblemSection />
        <BeforeAfterSection />
        <ExperienceCta />
        <ArchitectureSection />
        <FeatureSection />
        <ReliabilitySection />
        <ExperienceCta />
        <RoadmapSection />
      </main>
      <ShowcaseFooter />
    </div>
  );
}
