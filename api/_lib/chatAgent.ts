import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { APICallError } from '@ai-sdk/provider';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  pipeUIMessageStreamToResponse,
  streamText,
  tool,
  type UIMessage,
} from 'ai';
import type { ServerResponse } from 'node:http';
import { checkPrivacyRisk } from '../../src/utils/privacy.js';
import type { LoanConditions } from '../../src/types/loan.js';
import {
  calculateRequiredRentInputSchema,
  calculateRTIInputSchema,
  compareRatesInputSchema,
  createRentLoanTableInputSchema,
  loanConditionsSchema,
  updateConditionsInputSchema,
} from '../../src/agent/schemas.js';
import {
  runCalculateRequiredRentTool,
  runCalculateRTITool,
  runCompareRatesTool,
  runCreateRentLoanTableTool,
  runUpdateConditionsTool,
} from '../../src/agent/rtiTools.js';

export const MAX_CHAT_TURNS = 20;
export const MAX_MESSAGE_LENGTH = 2000;
export const CHAT_TIMEOUT_MS = 90_000;

/** Free-tier 할당량이 모델별로 분리되므로, 고갈되기 쉬운 모델은 뒤로 둔다. */
export const CHAT_MODEL_CANDIDATES = [
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
] as const;

export const CHAT_PRIVACY_MESSAGE =
  '개인정보 또는 고객식별정보로 추정되는 내용이 포함되어 있습니다.\n해당 정보를 삭제한 후 금액과 계산조건만 입력해 주세요.';

export const CHAT_SYSTEM_INSTRUCTION = `당신은 기업대출 RTI 분석 및 상담지원 AI Agent입니다.

사용자의 자연어 질문을 이해하고 기업대출 RTI 계산과
조건별 비교를 지원합니다.

모든 숫자 계산은 반드시 제공된 계산도구를 호출하여 수행하십시오.
암산하거나 추정한 결과를 답변하지 마십시오.

현재 상담조건이 있는 경우 사용자가 변경한 항목만 수정하고
나머지 조건은 기존 값을 유지하십시오.

값이 누락되었지만 현재 상담조건으로 계산할 수 있으면 기존 값을
사용하십시오.

필수값이 전혀 없거나 의미가 불명확하면 필요한 항목만 간단히
질문하십시오.

답변 작성 규칙:
- 질문에 직접 해당하는 결과만 간결하게 작성하십시오.
- "참고 사항", "유의사항", "### 참고" 같은 별도 섹션을 만들지 마십시오.
- 사용자가 묻지 않은 필요 월세, 면책 문구, 추가 안내, 다음 질문 유도는 넣지 마십시오.
- 필요 월세는 사용자가 명시적으로 물었을 때만 답하십시오.
- 마크다운 제목(###)과 장황한 개요보다 핵심 수치와 적용조건을 우선하십시오.

질문에 따라 포함할 수 있는 내용(요청된 항목만):
- 현재 적용조건
- RTI 계산결과
- 목표 RTI 충족 여부
- 최대 대출 가능금액
- 초과 또는 여유금액
- 필요 월세(요청 시에만)
- 금리변동 영향
- 월세별 대출한도

대출 승인 여부를 확정적으로 표현하지 마십시오.

고객명, 주민등록번호, 사업자등록번호, 계좌번호, 상세주소,
내부 신용등급 등 개인정보나 비공개정보 입력을 유도하지 마십시오.

도구 사용 지침:
- 조건 분석/계산·최대 대출금액 질문 → calculateRTI
  (계산 후 화면의 대출 희망금액은 산출된 최대 대출금액으로 자동 갱신됨)
- 금리만 변경 등 일부 조건 변경 → updateConditions 후 필요 시 calculateRTI
- 여러 금리 비교 → compareRates
- 필요 월세 질문 → calculateRequiredRent
- 월세별 표 요청 → createRentLoanTable
- 숫자는 도구 결과만 인용하고 임의로 재계산하지 말 것`;

function createRtiTools(currentConditions: LoanConditions) {
  return {
    calculateRTI: tool({
      description:
        'RTI 및 대출한도·필요월세 등 핵심 지표를 TypeScript 계산엔진으로 산출합니다. 숫자 계산이 필요하면 반드시 호출하세요.',
      inputSchema: calculateRTIInputSchema,
      execute: async (input) => runCalculateRTITool(currentConditions, input),
    }),
    compareRates: tool({
      description: '여러 적용금리 조건의 RTI·대출한도를 비교합니다.',
      inputSchema: compareRatesInputSchema,
      execute: async (input) => runCompareRatesTool(currentConditions, input),
    }),
    calculateRequiredRent: tool({
      description: '희망 대출금액을 유지하기 위해 필요한 월세/연세를 계산합니다.',
      inputSchema: calculateRequiredRentInputSchema,
      execute: async (input) => runCalculateRequiredRentTool(currentConditions, input),
    }),
    createRentLoanTable: tool({
      description: '월세 구간별 최대 대출금액 표를 생성합니다.',
      inputSchema: createRentLoanTableInputSchema,
      execute: async (input) => runCreateRentLoanTableTool(currentConditions, input),
    }),
    updateConditions: tool({
      description:
        '현재 상담조건 중 변경된 항목만 갱신합니다. 예: "금리만 4.5%로 바꿔줘". 변경 후 계산이 필요하면 calculateRTI를 이어서 호출하세요.',
      inputSchema: updateConditionsInputSchema,
      execute: async (input) => runUpdateConditionsTool(currentConditions, input),
    }),
  };
}

export interface ChatRequestBody {
  messages: UIMessage[];
  currentConditions: LoanConditions;
}

export type ChatHandlerError = {
  ok: false;
  status: number;
  message: string;
};

function getErrorStatus(error: unknown): number | undefined {
  if (APICallError.isInstance(error)) return error.statusCode;

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.statusCode === 'number') return record.statusCode;
    if (typeof record.status === 'number') return record.status;
    if ('lastError' in record) return getErrorStatus(record.lastError);
    if ('cause' in record) return getErrorStatus(record.cause);
  }
  return undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function isQuotaOrUnavailable(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 429 || status === 503) return true;
  const message = getErrorMessage(error);
  return /quota|RESOURCE_EXHAUSTED|rate.?limit|UNAVAILABLE|high demand|exceeded your current quota/i.test(
    message,
  );
}

/** 클라이언트에 노출할 한국어 오류 메시지 */
export function formatChatError(error: unknown): string {
  if (isQuotaOrUnavailable(error)) {
    return 'AI 서비스 사용량이 일시적으로 초과되었습니다. 약 1분 후 다시 시도해 주세요.';
  }

  const status = getErrorStatus(error);
  if (status === 404 || /no longer available|not found/i.test(getErrorMessage(error))) {
    return '선택한 AI 모델을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }

  return '상담 Agent 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

function getLatestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || message.role !== 'user') continue;
    const text = message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
    if (text.trim()) return text;
  }
  return '';
}

function validateChatRequest(body: unknown): ChatHandlerError | { ok: true; data: ChatRequestBody } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, status: 400, message: '요청 본문이 올바르지 않습니다.' };
  }

  const record = body as Record<string, unknown>;
  const messages = record.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, status: 400, message: '대화 메시지가 필요합니다.' };
  }
  if (messages.length > MAX_CHAT_TURNS) {
    return {
      ok: false,
      status: 400,
      message: `대화가 너무 깁니다. ${MAX_CHAT_TURNS}턴 이하로 초기화 후 다시 시도해 주세요.`,
    };
  }

  const conditionsParsed = loanConditionsSchema.safeParse(record.currentConditions);
  if (!conditionsParsed.success) {
    return { ok: false, status: 400, message: '현재 상담조건 형식이 올바르지 않습니다.' };
  }

  const latestUserText = getLatestUserText(messages as UIMessage[]);
  if (!latestUserText.trim()) {
    return { ok: false, status: 400, message: '분석할 메시지를 입력해 주세요.' };
  }
  if (latestUserText.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `메시지가 너무 깁니다. ${MAX_MESSAGE_LENGTH}자 이하로 입력해 주세요.`,
    };
  }

  const privacy = checkPrivacyRisk(latestUserText);
  if (privacy.hasSensitiveInfo) {
    return { ok: false, status: 400, message: CHAT_PRIVACY_MESSAGE };
  }

  return {
    ok: true,
    data: {
      messages: messages as UIMessage[],
      currentConditions: conditionsParsed.data,
    },
  };
}

function buildChatUIMessageStream(data: ChatRequestBody, apiKey: string) {
  const google = createGoogleGenerativeAI({ apiKey });
  const tools = createRtiTools(data.currentConditions);

  return createUIMessageStream({
    onError: formatChatError,
    execute: async ({ writer }) => {
      const modelMessages = await convertToModelMessages(data.messages);
      let lastError: unknown;

      for (const modelId of CHAT_MODEL_CANDIDATES) {
        try {
          console.info(`[chat] using model ${modelId}`);
          const result = streamText({
            model: google(modelId),
            system: CHAT_SYSTEM_INSTRUCTION,
            messages: modelMessages,
            tools,
            stopWhen: isStepCount(8),
            timeout: CHAT_TIMEOUT_MS,
            temperature: 0.2,
            maxRetries: 1,
          });

          const uiStream = result.toUIMessageStream({ onError: formatChatError });
          const reader = uiStream.getReader();
          let wroteMeaningfulChunk = false;
          let failedWithRetriable = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!value) continue;

              if (value.type === 'error') {
                lastError = value.errorText;
                // 의미 있는 내용이 나가기 전이면 다음 모델로 폴백
                if (!wroteMeaningfulChunk) {
                  failedWithRetriable = true;
                  break;
                }
                writer.write(value);
                return;
              }

              if (value.type !== 'start' && value.type !== 'start-step') {
                wroteMeaningfulChunk = true;
              }

              writer.write(value);
            }
          } finally {
            reader.releaseLock();
          }

          if (failedWithRetriable) {
            console.warn(`[chat] model ${modelId} returned early error, trying next model`);
            continue;
          }

          return;
        } catch (error) {
          lastError = error;
          console.error(`[chat] model ${modelId} failed:`, error);
          if (!isQuotaOrUnavailable(error)) {
            throw error;
          }
        }
      }

      writer.write({
        type: 'error',
        errorText: formatChatError(lastError ?? new Error('모든 모델 호출에 실패했습니다.')),
      });
    },
  });
}

/**
 * 검증 후 UI 메시지 스트림을 생성한다.
 */
export function prepareChatStream(
  body: unknown,
  apiKey: string | undefined,
): ChatHandlerError | { ok: true; stream: ReturnType<typeof createUIMessageStream> } {
  const validated = validateChatRequest(body);
  if (!validated.ok) return validated;

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      message: '서버 설정에 문제가 발생했습니다. 관리자에게 문의해 주세요.',
    };
  }

  return {
    ok: true,
    stream: buildChatUIMessageStream(validated.data, apiKey),
  };
}

export function pipeChatStreamToNodeResponse(
  stream: ReturnType<typeof createUIMessageStream>,
  response: ServerResponse,
): void {
  pipeUIMessageStreamToResponse({
    response,
    stream,
  });
}

export async function createChatWebResponse(
  body: unknown,
  apiKey: string | undefined,
): Promise<Response> {
  const prepared = prepareChatStream(body, apiKey);
  if (!prepared.ok) {
    return Response.json({ message: prepared.message }, { status: prepared.status });
  }
  return createUIMessageStreamResponse({
    stream: prepared.stream,
  });
}
