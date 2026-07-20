import { SHOWCASE_NAV } from './showcaseData';

export function ShowcaseHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#overview" className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">
          KB RTI AI Agent
        </a>
        <nav aria-label="소개 페이지 메뉴" className="hidden items-center gap-1 lg:flex">
          {SHOWCASE_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gold-50 hover:text-gold-800"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#demo"
          className="inline-flex min-h-10 items-center rounded-md bg-gold-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
        >
          정적 데모
        </a>
      </div>
      <nav aria-label="소개 페이지 모바일 메뉴" className="border-t border-gray-100 px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
          {SHOWCASE_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
