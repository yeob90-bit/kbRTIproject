import { ArchitectureSection } from '../components/showcase/ArchitectureSection';
import { BeforeAfterSection } from '../components/showcase/BeforeAfterSection';
import { DemoSection } from '../components/showcase/DemoSection';
import { FeatureSection } from '../components/showcase/FeatureSection';
import { HeroSection } from '../components/showcase/HeroSection';
import { ProblemSection } from '../components/showcase/ProblemSection';
import { ReliabilitySection } from '../components/showcase/ReliabilitySection';
import { RoadmapSection } from '../components/showcase/RoadmapSection';
import { ShowcaseFooter } from '../components/showcase/ShowcaseFooter';
import { ShowcaseHeader } from '../components/showcase/ShowcaseHeader';
import { useEffect } from 'react';

function ExperienceCta() {
  return (
    <section aria-labelledby="cta-heading" className="border-b border-gray-200 bg-gold-50">
      <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:py-14">
        <h2 id="cta-heading" className="text-2xl font-bold text-gray-900">
          설명보다 직접 확인해보세요
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-700">
          공개 페이지에서는 TypeScript 계산엔진 기반 정적 데모를 바로 체험할 수 있습니다.
          실제 AI Agent는 Access Code 인증 후 사용할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#demo"
            className="inline-flex min-h-11 items-center rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
          >
            정적 데모 체험하기
          </a>
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:border-gold-400 hover:bg-gold-50"
          >
            인증 후 실제 Agent 사용
          </a>
        </div>
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
        <DemoSection />
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
