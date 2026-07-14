# 기업대출 RTI 분석 및 상담지원 AI Agent

기업대출 상담업무에 사용할 수 있는 웹 기반 **RTI(임대업이자상환비율) 분석 및 상담지원 AI Agent**입니다.

> **핵심 원칙: AI는 RTI나 대출 가능금액을 절대 직접 계산하지 않습니다.**
> AI(Gemini)는 상담원이 입력한 자연어에서 계산에 필요한 조건(월 임대료, 대출 희망금액, 금리 등)만 JSON으로 추출하고, 실제 RTI·최대 대출금액 산출과 분석문구 생성은 전부 TypeScript 코드(계산엔진)가 수행합니다.

---

## 1. 프로젝트 개요

기업(상가·건물 등) 임대업 대출 상담 시 은행 직원이 매번 수동으로 RTI와 최대 대출 가능금액을 계산하는 업무를 자동화합니다. 상담원은 자연어로 조건을 말하듯 입력하거나, 화면에서 직접 값을 입력해 즉시 계산 결과와 코드 기반 분석의견을 받을 수 있습니다.

## 2. 해결하려는 업무문제

- RTI 계산은 반복적이지만 실수가 발생하기 쉬운 수작업입니다.
- 상담 중 빠르게 "이 조건이면 얼마까지 대출 가능한가"를 확인해야 합니다.
- AI에게 계산을 맡기면 수치 오류(환각)의 위험이 있으므로, **AI는 조건 추출만** 담당하고 **계산은 검증 가능한 코드**가 담당하도록 역할을 분리했습니다.
- 상담 중 고객 개인정보가 AI 서비스로 전송되는 것을 막기 위한 사전 검사 장치를 마련했습니다.

## 3. 전체 아키텍처

```text
직원 자연어 입력
  → Vercel 서버리스 API (/api/parse-loan) 호출
  → 서버에서 개인정보 패턴 사전검사
  → Gemini API가 구조화된 JSON으로 조건만 추출 (계산 없음)
  → 클라이언트에서 추출 결과 확인 및 수정 (AI 결과를 바로 신뢰하지 않음)
  → "이 조건으로 계산" 클릭 시 TypeScript 계산엔진(src/utils/calculations.ts) 실행
  → RTI, 최대 대출금액, 필요 월세 등 산출
  → 코드 기반 분석의견(src/utils/analysis.ts) 생성 (AI 재호출 없음)
```

```text
브라우저(React)                     Vercel 서버리스(Node.js)         Gemini API
─────────────────                  ──────────────────────         ──────────
자연어 입력 ───POST /api/parse-loan──▶ 개인정보 사전검사               │
                                    │  ── 통과 시 ──▶ 구조화 JSON 요청 ─▶ 조건 추출
                                    │ ◀── JSON 응답 ──────────────────┘
결과 확인/수정 ◀────────────────────┘
      │
      ▼
계산엔진 실행 (클라이언트, 순수 TS 함수)
      │
      ▼
결과 카드 / 상세표 / 분석의견 / CSV
```

- **프론트엔드**: Vite + React + TypeScript + Tailwind CSS (SPA, 반응형)
- **서버리스 API**
  - `api/parse-loan.ts` — 일회성 자연어 조건 추출
  - `api/chat.ts` — 다회차 상담 Agent (Vercel AI SDK + Gemini tool calling, 스트리밍)
- **AI**: 조건 추출은 `@google/genai`, 상담 채팅은 `ai` + `@ai-sdk/google` 사용. 숫자 계산은 AI가 수행하지 않음
- **계산엔진**: `src/utils/calculations.ts` + Agent 도구(`src/agent/rtiTools.ts`) — 순수 TypeScript 함수만 사용
- **저장**: 금리·목표 RTI·표 설정은 `localStorage`에 저장. 채팅 원문은 기본적으로 저장하지 않음

## 4. 설치방법

```bash
npm install
```

## 5. 로컬 실행방법

```bash
npm run dev
```

기본적으로 `http://localhost:5173` 에서 실행됩니다. `/api/parse-loan`과 `/api/chat` 모두 Vite 개발 미들웨어로 동작하므로 `.env.local`에 `GEMINI_API_KEY`만 있으면 로컬에서 AI 기능을 사용할 수 있습니다.

```bash
npm run build     # 프로덕션 빌드 (tsc -b && vite build)
npm run preview   # 빌드 결과 미리보기
npm run test      # Vitest 테스트 실행 (1회)
npm run test:watch  # Vitest watch 모드
npm run lint      # ESLint 검사
```

## 6. Gemini API 키 설정방법

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 Gemini API 키를 발급받습니다.
2. 프로젝트 루트에 `.env.local` 파일을 생성하고 다음을 추가합니다.

```text
GEMINI_API_KEY=your_gemini_api_key
```

- 이 키는 **서버(Vercel 서버리스 함수)에서만** 읽습니다. `VITE_` 접두사를 사용하지 않으며, 브라우저 코드에서는 절대 참조하지 않습니다.
- `.env`, `.env.local`, `.env.*.local` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다.

## 7. Vercel 배포방법

1. GitHub 등에 리포지토리를 푸시합니다.
2. [Vercel](https://vercel.com)에서 프로젝트를 Import 합니다. (Framework Preset: Vite 자동 감지)
3. Vercel 프로젝트 설정 → Environment Variables에 `GEMINI_API_KEY`를 등록합니다.
4. 배포하면 `api/parse-loan.ts`가 `/api/parse-loan` 서버리스 함수로 자동 등록됩니다.
5. `vercel.json`은 SPA 새로고침 시 정적 라우팅이 깨지지 않도록 `/api/*`를 제외한 모든 경로를 `index.html`로 라우팅합니다.

CLI로 배포할 경우:

```bash
npm install -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```

## 8. 계산식

| 항목 | 계산식 |
| --- | --- |
| 연간 임대료 | 월 임대료 × 12 |
| 검토금리 | 적용금리 + 스트레스금리 |
| 정상 연간 이자 | 대출 희망금액 × 적용금리 |
| 스트레스 반영 연간 이자 | 대출 희망금액 × 검토금리 |
| 현재 RTI | 연간 임대료 ÷ 스트레스 반영 연간 이자 |
| 목표 RTI 기준 최대 대출금액 | 연간 임대료 ÷ (목표 RTI × 검토금리) |
| 현재 대출금액 유지를 위한 필요 월세 | 대출 희망금액 × 검토금리 × 목표 RTI ÷ 12 |

최대 대출금액은 100만원 단위로 반올림/절사/올림 처리할 수 있으며(`src/utils/rounding.ts`), 기본값은 반올림입니다.

## 9. 자연어 입력 예시

```text
월세 2천만원이고 대출은 38억1천만원을 신청할 예정이야.
적용금리는 4.1%, 스트레스금리는 2%, 목표 RTI는 1.5배야.
```

```text
연 임대료가 2억4천만원이고, 대출은 30억원이야.
금리 3.9%, 스트레스 2%, 목표 RTI 1.5배로 봐줘.
```

AI는 위 문장에서 값을 JSON으로만 추출하며, 누락된 값은 임의로 채우지 않고 `missingFields`에 기록합니다.

## 10. 개인정보 입력금지 안내

화면 상단에 항상 다음 경고가 표시됩니다.

> 고객명, 주민등록번호, 사업자등록번호, 계좌번호, 실제 상호, 상세주소 및 내부 신용등급 등 고객식별정보와 내부 비공개정보는 입력하지 마십시오.

- 클라이언트와 서버 양쪽에서 주민등록번호, 사업자등록번호, 전화번호, 이메일, 계좌번호로 추정되는 패턴을 사전 검사합니다(`src/utils/privacy.ts`).
- 탐지 시 API 호출 자체가 차단되고 다음 안내가 표시됩니다.

> 개인정보 또는 고객식별정보로 추정되는 내용이 발견되었습니다. 해당 내용을 삭제한 후 금액과 계산조건만 입력해 주세요.

- 금액 표현(예: `3,810,000,000원`, `38억1천만원`)은 계좌번호 패턴(하이픈 포함 숫자열)과 혼동되지 않도록 검사 로직을 보수적으로 설계했습니다.
- 자연어 입력 원문은 개인정보 위험이 있으므로 `localStorage`에 저장하지 않습니다.

## 11. 테스트방법

```bash
npm run test
```

`src/test/calculations.test.ts`, `src/test/validation.test.ts`에 계산엔진·반올림·월세표·유효성 검사·개인정보 탐지 테스트가 포함되어 있습니다. 명세서의 계산 테스트 1(월 임대료 2천만원, 대출 38.1억원 등) 케이스가 포함되어 있으며, 실행 시 25개 테스트가 모두 통과합니다.

## 12. 주요 파일 설명

| 경로 | 설명 |
| --- | --- |
| `api/parse-loan.ts` | Gemini API를 호출하는 Vercel 서버리스 함수. 개인정보 검사, 입력 검증, 오류 상태코드 처리를 담당 |
| `src/types/loan.ts` | 대출조건, 파싱결과, 계산결과 등 핵심 타입 정의 |
| `src/utils/calculations.ts` | RTI·최대 대출금액·월세표를 산출하는 순수 계산함수 (AI 미사용) |
| `src/utils/rounding.ts` | 100만원 단위 반올림/절사/올림 함수 |
| `src/utils/analysis.ts` | 계산결과만으로 분석문구를 생성하는 코드 기반 로직 (AI 재호출 없음) |
| `src/utils/privacy.ts` | 개인정보/고객식별정보 추정 패턴 사전검사 |
| `src/utils/validation.ts` | 입력값 및 localStorage 저장값 유효성 검증 |
| `src/utils/csv.ts` | 계산결과를 CSV로 변환/다운로드 |
| `src/services/loanParserApi.ts` | `/api/parse-loan` 호출 클라이언트 |
| `src/hooks/useLocalStorage.ts` | 유효성 검증 포함 localStorage 동기화 훅 |
| `src/components/*` | 자연어 입력, 추출값 확인폼, 수동 입력폼, 결과카드, 상세표, 월세표, 분석의견, 경고, 오류 컴포넌트 |
| `src/App.tsx` | 전체 화면 상태관리 및 컴포넌트 조합 |

## 13. 향후 개선계획

- 여러 물건(담보) 비교 및 포트폴리오 단위 RTI 분석
- 상담 이력 저장 및 PDF 상담확인서 출력
- 서버리스 함수의 다중 인스턴스 환경을 고려한 영속적 호출제한(Redis 등) 도입
- 조직 내 인증/권한 연동 및 상담원별 이용 로그 적재
- 다양한 차주 유형별 세부 RTI 정책(가산금리, 업종별 스트레스금리 등) 반영

---

## 면책문구

본 애플리케이션의 계산결과는 입력된 조건을 기준으로 한 참고용 산출값이며, 실제 여신심사 결과와 다를 수 있습니다. 최종 대출조건 및 승인 여부는 관련 규정과 심사기준에 따라 결정됩니다.
