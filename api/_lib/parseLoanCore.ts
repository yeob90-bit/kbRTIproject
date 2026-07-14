import { GoogleGenAI, Type } from '@google/genai';
import { checkPrivacyRisk } from '../../src/utils/privacy.js';
import type { BorrowerType, ParsedLoanConditions } from '../../src/types/loan.js';

export const MAX_INPUT_LENGTH = 2000;
/** 우선순위 순. 일시적 과부하(503) 시 다음 모델로 폴백한다. */
export const MODEL_CANDIDATES = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'] as const;
export const MODEL_NAME = MODEL_CANDIDATES[0];

const SYSTEM_INSTRUCTION = `당신은 기업대출 RTI 분석 웹서비스의 입력조건 추출 Agent입니다.

사용자가 한국어로 입력한 기업대출 상담조건에서 필요한 값을 추출하여 정해진 JSON 형식으로만 반환하십시오.

추출 대상:
- monthlyRent: 월 임대료 원 단위
- requestedLoanAmount: 대출 희망금액 원 단위
- appliedRatePercent: 적용금리 퍼센트 숫자
- stressRatePercent: 스트레스금리 퍼센트포인트 숫자
- targetRTI: 목표 RTI 배수
- borrowerType: individual, corporate, unknown
- propertyPrice: 매매가 원 단위
- collateralValue: 담보평가액 원 단위
- ltvPercent: LTV 퍼센트
- missingFields: 누락된 필수항목
- warnings: 불명확하거나 충돌하는 내용

금액 변환기준:
- 1만원 = 10,000원
- 100만원 = 1,000,000원
- 1억원 = 100,000,000원
- 38억1천만원 = 3,810,000,000원
- 월세라고 명시된 금액은 monthlyRent로 처리
- 연 임대료라고 명시된 경우 12로 나누어 monthlyRent로 환산

금리 처리기준:
- 금리 4.1%는 appliedRatePercent에 4.1로 저장
- 스트레스금리 2%는 stressRatePercent에 2로 저장
- 금리를 0.041로 변환하지 말 것
- 스트레스금리를 적용금리에 합산하지 말 것

필수항목:
- monthlyRent
- requestedLoanAmount
- appliedRatePercent
- stressRatePercent
- targetRTI

누락값은 임의로 추정하지 말고 null로 반환한 뒤 missingFields에 기록하십시오.

중요 제한:
- RTI를 직접 계산하지 마십시오.
- 최대 대출금액을 직접 계산하지 마십시오.
- 상담의견을 작성하지 마십시오.
- 입력조건만 구조화하십시오.
- JSON 외의 문장을 반환하지 마십시오.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    monthlyRent: { type: Type.NUMBER, nullable: true },
    requestedLoanAmount: { type: Type.NUMBER, nullable: true },
    appliedRatePercent: { type: Type.NUMBER, nullable: true },
    stressRatePercent: { type: Type.NUMBER, nullable: true },
    targetRTI: { type: Type.NUMBER, nullable: true },
    borrowerType: { type: Type.STRING, enum: ['individual', 'corporate', 'unknown'] },
    propertyPrice: { type: Type.NUMBER, nullable: true },
    collateralValue: { type: Type.NUMBER, nullable: true },
    ltvPercent: { type: Type.NUMBER, nullable: true },
    missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'monthlyRent',
    'requestedLoanAmount',
    'appliedRatePercent',
    'stressRatePercent',
    'targetRTI',
    'borrowerType',
    'propertyPrice',
    'collateralValue',
    'ltvPercent',
    'missingFields',
    'warnings',
  ],
} as const;

const VALID_BORROWER_TYPES: BorrowerType[] = ['individual', 'corporate', 'unknown'];

export type ParseLoanResult =
  | { ok: true; data: ParsedLoanConditions }
  | { ok: false; status: number; message: string };

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export function validateAndNormalize(raw: unknown): ParsedLoanConditions | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;

  const borrowerTypeRaw = record.borrowerType;
  const borrowerType: BorrowerType = VALID_BORROWER_TYPES.includes(borrowerTypeRaw as BorrowerType)
    ? (borrowerTypeRaw as BorrowerType)
    : 'unknown';

  const hasRequiredKeys = [
    'monthlyRent',
    'requestedLoanAmount',
    'appliedRatePercent',
    'stressRatePercent',
    'targetRTI',
  ].every((key) => key in record);

  if (!hasRequiredKeys) return null;

  return {
    monthlyRent: toNullableNumber(record.monthlyRent),
    requestedLoanAmount: toNullableNumber(record.requestedLoanAmount),
    appliedRatePercent: toNullableNumber(record.appliedRatePercent),
    stressRatePercent: toNullableNumber(record.stressRatePercent),
    targetRTI: toNullableNumber(record.targetRTI),
    borrowerType,
    propertyPrice: toNullableNumber(record.propertyPrice),
    collateralValue: toNullableNumber(record.collateralValue),
    ltvPercent: toNullableNumber(record.ltvPercent),
    missingFields: toStringArray(record.missingFields),
    warnings: toStringArray(record.warnings),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function isRetriableStatus(status: number | undefined): boolean {
  return status === 429 || status === 503;
}

/**
 * 자연어 문장에서 대출조건을 추출한다. (Vercel / Vite 공용 코어)
 */
export async function parseLoanText(text: string, apiKey: string | undefined): Promise<ParseLoanResult> {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, status: 400, message: '분석할 문장을 입력해 주세요.' };
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `입력 문장이 너무 깁니다. ${MAX_INPUT_LENGTH}자 이하로 입력해 주세요.`,
    };
  }

  const privacyCheck = checkPrivacyRisk(text);
  if (privacyCheck.hasSensitiveInfo) {
    return {
      ok: false,
      status: 400,
      message:
        '개인정보 또는 고객식별정보로 추정되는 내용이 발견되었습니다.\n해당 내용을 삭제한 후 금액과 계산조건만 입력해 주세요.',
    };
  }

  if (!apiKey) {
    console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    return {
      ok: false,
      status: 500,
      message: '서버 설정에 문제가 발생했습니다. 관리자에게 문의해 주세요.',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: text,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
          },
        });

        const rawText = response.text;
        if (!rawText) {
          return { ok: false, status: 502, message: 'AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.' };
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawText);
        } catch {
          return {
            ok: false,
            status: 422,
            message: 'AI 응답을 해석할 수 없습니다. 문장을 조금 더 명확하게 입력해 주세요.',
          };
        }

        const normalized = validateAndNormalize(parsedJson);
        if (!normalized) {
          return {
            ok: false,
            status: 422,
            message: 'AI가 반환한 결과의 형식이 올바르지 않습니다. 문장을 조금 더 명확하게 입력해 주세요.',
          };
        }

        return { ok: true, data: normalized };
      } catch (error) {
        lastError = error;
        const status = getErrorStatus(error);
        console.error(`Gemini API 호출 오류 (${model}, attempt ${attempt + 1}):`, error);

        if (isRetriableStatus(status) && attempt === 0) {
          await sleep(800);
          continue;
        }
        // 과부하/한도는 다음 모델로 폴백, 그 외는 즉시 중단
        if (!isRetriableStatus(status)) {
          return {
            ok: false,
            status: 502,
            message: 'AI 서비스 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          };
        }
        break;
      }
    }
  }

  const lastStatus = getErrorStatus(lastError);
  if (isRetriableStatus(lastStatus)) {
    return {
      ok: false,
      status: 502,
      message: 'AI 서비스가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  return {
    ok: false,
    status: 502,
    message: 'AI 서비스 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  };
}
