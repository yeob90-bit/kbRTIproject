import type { KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled = false }: ChatInputProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      <label htmlFor="chat-input" className="sr-only">
        상담 메시지 입력
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="chat-input"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="예: 금리만 3.8%로 바꿔줘 (Enter 전송, Shift+Enter 줄바꿈)"
          className="input-field !text-left min-h-[2.75rem] flex-1 resize-y"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
