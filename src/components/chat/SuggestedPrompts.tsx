const SUGGESTED_PROMPTS = [
  '월세 2천만원, 대출 38.1억원으로 분석해줘.',
  '현재 조건에서 금리가 0.3%p 오르면 어떻게 돼?',
  '대출금액을 유지하려면 월세가 얼마 필요해?',
  '3.8%, 4.1%, 4.5% 조건을 비교해줘.',
  '월세 1천만원부터 3천만원까지 한도표를 만들어줘.',
  '지점장님 보고용으로 세 줄 요약해줘.',
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ onSelect, disabled = false }: SuggestedPromptsProps) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-gray-500">예시 질문</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-left text-xs text-gray-700 transition-colors hover:border-gold-400 hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
