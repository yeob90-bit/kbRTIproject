export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-gray-500" aria-label="AI 응답 준비 중">
      <span className="inline-flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-500 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-500 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-500" />
      </span>
      계산도구 준비 및 답변 생성 중…
    </div>
  );
}
