interface ChatMessageViewProps {
  role: 'user' | 'assistant' | 'system';
  text: string;
  streaming?: boolean;
}

export function ChatMessageView({ role, text, streaming = false }: ChatMessageViewProps) {
  if (!text.trim() && role === 'assistant') return null;

  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[80%] ${
          isUser
            ? 'bg-gold-600 text-white'
            : 'border border-gray-200 bg-white text-gray-800'
        }`}
      >
        {!isUser && <p className="mb-1 text-xs font-semibold text-gold-700">AI Agent</p>}
        {text}
        {streaming && text && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-gold-500 align-middle" aria-hidden />}
      </div>
    </div>
  );
}
