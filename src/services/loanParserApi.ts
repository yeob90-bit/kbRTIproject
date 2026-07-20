import type { ParsedLoanConditions } from '../types/loan';

export class LoanParserApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LoanParserApiError';
    this.status = status;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: '입력값이 없거나 요청 형식이 올바르지 않습니다.',
  401: '인증이 필요합니다. Access Code로 다시 로그인해 주세요.',
  403: '허용되지 않은 요청입니다.',
  404: '조건 추출 API를 찾을 수 없습니다. 개발 서버를 재시작한 뒤 다시 시도해 주세요.',
  405: '허용되지 않은 요청 방식입니다.',
  413: '요청 본문이 너무 큽니다.',
  422: 'AI가 반환한 결과의 형식이 올바르지 않습니다. 다시 시도해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  500: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: 'AI 서비스 응답에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

/**
 * 자연어 문장을 서버리스 API(/api/parse-loan)로 전송하여 대출조건 JSON을 추출한다.
 * Gemini API 키는 클라이언트에 노출되지 않으며, 이 함수는 서버 응답만 전달받는다.
 */
export async function parseLoanConditions(text: string): Promise<ParsedLoanConditions> {
  let response: Response;
  try {
    response = await fetch('/api/parse-loan', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new LoanParserApiError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.', 0);
  }

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const errorBody = (await response.json()) as { message?: string };
      serverMessage = errorBody?.message;
    } catch {
      // 응답 본문이 JSON이 아닐 수 있음
    }

    const message = serverMessage ?? STATUS_MESSAGES[response.status] ?? '알 수 없는 오류가 발생했습니다.';
    throw new LoanParserApiError(message, response.status);
  }

  const data = (await response.json()) as ParsedLoanConditions;
  return data;
}
