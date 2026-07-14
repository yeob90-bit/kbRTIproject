import { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, isToolUIPart, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import type { LoanConditions } from '../../types/loan';
import { checkPrivacyRisk } from '../../utils/privacy';
import { ChatMessageView } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import { TypingIndicator } from './TypingIndicator';
import type { ToolResultEvent } from './types';

const INITIAL_ASSISTANT_TEXT = `안녕하세요. 기업대출 RTI 상담 Agent입니다.

월 임대료, 대출 희망금액, 적용금리 등을 자연어로 입력해 주세요.

예:
월세 2천만원, 대출 38.1억원, 적용금리 4.1%,
스트레스금리 2%, 목표 RTI 1.5배로 분석해줘.`;

function toDisplayError(message: string | undefined): string {
  if (!message) return '상담 Agent 응답 중 오류가 발생했습니다.';
  if (/An error occurred|quota|RESOURCE_EXHAUSTED|429/i.test(message)) {
    return 'AI 서비스 사용량이 일시적으로 초과되었습니다. 약 1분 후 다시 시도해 주세요.';
  }
  return message;
}

const CHAT_PRIVACY_CLIENT_MESSAGE =
  '개인정보 또는 고객식별정보로 추정되는 내용이 포함되어 있습니다.\n해당 정보를 삭제한 후 금액과 계산조건만 입력해 주세요.';

function createWelcomeMessage(): UIMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    parts: [{ type: 'text', text: INITIAL_ASSISTANT_TEXT }],
  };
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

interface ChatPanelProps {
  currentConditions: LoanConditions;
  onToolResult: (event: ToolResultEvent) => void;
}

export function ChatPanel({ currentConditions, onToolResult }: ChatPanelProps) {
  const appliedToolCallIds = useRef(new Set<string>());
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

  const { messages, sendMessage, status, error, setMessages, stop, clearError } = useChat({
    transport,
    messages: [createWelcomeMessage()],
    onError: (err) => {
      setLocalError(toDisplayError(err.message));
    },
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        if (part.state !== 'output-available') continue;
        if (appliedToolCallIds.current.has(part.toolCallId)) continue;

        appliedToolCallIds.current.add(part.toolCallId);
        const output = part.output as {
          toolName?: string;
          input?: unknown;
          output?: unknown;
          updatedConditions?: Partial<LoanConditions>;
          tableSettings?: { startMonthlyRent: number; endMonthlyRent: number; rentStep: number };
        };

        onToolResult({
          toolName: output.toolName ?? part.type.replace(/^tool-/, ''),
          input: output.input ?? part.input,
          output: output.output ?? output,
          updatedConditions: output.updatedConditions,
          tableSettings: output.tableSettings,
        });
      }
    }
  }, [messages, onToolResult]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    const privacy = checkPrivacyRisk(trimmed);
    if (privacy.hasSensitiveInfo) {
      setLocalError(CHAT_PRIVACY_CLIENT_MESSAGE);
      return;
    }

    setLocalError(null);
    clearError();
    setInput('');
    await sendMessage({ text: trimmed }, { body: { currentConditions } });
  }

  function handleReset() {
    stop();
    appliedToolCallIds.current.clear();
    setMessages([createWelcomeMessage()]);
    setInput('');
    setLocalError(null);
    clearError();
  }

  return (
    <section aria-labelledby="chat-heading" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="chat-heading" className="text-base font-semibold text-gray-900">
            RTI 상담 Agent
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            대화를 통해 조건을 조정하고, 계산은 TypeScript 엔진이 수행합니다. AI는 산술계산을 직접 하지 않습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          대화 초기화
        </button>
      </div>

      <SuggestedPrompts disabled={isBusy} onSelect={(prompt) => void handleSend(prompt)} />

      <div className="mt-4 flex h-[min(28rem,60vh)] flex-col rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4" role="log" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <ChatMessageView role={message.role} text={extractText(message)} streaming={isBusy && message.role === 'assistant'} />
            </div>
          ))}
          {status === 'submitted' && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {(localError || error) && (
          <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-line text-red-700" role="alert">
            {localError ?? toDisplayError(error?.message)}
          </div>
        )}

        <ChatInput value={input} onChange={setInput} onSend={() => void handleSend(input)} disabled={isBusy} />
      </div>
    </section>
  );
}
