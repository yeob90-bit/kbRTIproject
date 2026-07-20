export const SHOWCASE_NAV = [
  { href: '#overview', label: '프로젝트 소개' },
  { href: '#demo', label: '정적 데모' },
  { href: '#workflow', label: '업무 개선' },
  { href: '#architecture', label: '처리 구조' },
  { href: '#features', label: '핵심 기능' },
  { href: '#reliability', label: '안정성' },
  { href: '#roadmap', label: '향후 계획' },
] as const;

export const HERO_FLOW = [
  '상담내용 입력',
  'AI 조건 추출',
  '직원 확인·수정',
  'TypeScript 계산',
  'RTI 분석결과',
] as const;

export const METRICS = [
  {
    title: '2가지 입력방식',
    description: '상담형 Agent + 빠른 자연어 입력',
  },
  {
    title: '코드 기반 계산',
    description: 'AI가 아닌 TypeScript 계산엔진',
  },
  {
    title: '이중 확인 구조',
    description: 'AI 추출값을 사용자가 확인·수정',
  },
  {
    title: '개인정보 보호',
    description: '클라이언트·서버 사전 패턴 검사',
  },
  {
    title: '자동화 테스트 30건',
    description: '계산·검증·Agent 도구 테스트',
  },
] as const;

export const PROBLEMS = [
  '상담 중 월세·대출금액·적용금리 등을 반복 입력해야 함',
  '적용금리와 스트레스금리를 반영해 RTI를 별도로 계산해야 함',
  '목표 RTI 기준 최대 대출금액과 필요 월세를 다시 산출해야 함',
  'AI에게 계산을 직접 맡기면 수치 오류 위험이 있음',
  '상담 내용에 고객식별정보가 포함될 가능성이 있음',
] as const;

export const BEFORE_STEPS = [
  '상담조건 확인',
  '수기 입력',
  '계산식 적용',
  '최대 대출금액 산출',
  '결과 정리',
] as const;

export const BEFORE_ISSUES = [
  '반복 입력',
  '계산 실수 가능성',
  '상담 중 즉시 비교하기 어려움',
  '조건 변경 시 재계산 필요',
] as const;

export const AFTER_STEPS = [
  '자연어 상담',
  '조건 자동 추출',
  '직원 확인',
  '코드 계산',
  '결과표 및 분석의견 생성',
] as const;

export const AFTER_IMPROVEMENTS = [
  '자연어와 직접 입력을 모두 지원',
  '조건 변경 시 결과 즉시 갱신',
  '월세별 대출한도 비교',
  'CSV 결과 저장',
  '계산 로직과 AI 역할 분리',
] as const;

export const PIPELINE_STEPS = [
  {
    step: '1',
    title: '직원 입력',
    description: '상담형 Agent 또는 빠른 자연어 입력',
  },
  {
    step: '2',
    title: '개인정보 사전검사',
    description: '고객식별정보로 추정되는 패턴 확인',
  },
  {
    step: '3',
    title: 'AI 조건 추출',
    description: '월 임대료, 대출금액, 금리, 목표 RTI 등을 구조화',
  },
  {
    step: '4',
    title: '사용자 확인',
    description: '추출된 조건을 직원이 확인하고 필요한 경우 수정',
  },
  {
    step: '5',
    title: 'TypeScript 계산엔진',
    description: 'RTI, 최대 대출금액, 필요 월세 등을 코드로 계산',
  },
  {
    step: '6',
    title: '결과 제공',
    description: '결과카드, 상세 계산표, 분석의견, 월세별 비교표, CSV',
  },
] as const;

export const TECH_FLOW = [
  'React UI',
  'Vercel Serverless API',
  'Gemini 조건 추출',
  'TypeScript 계산엔진',
  '결과 UI',
] as const;

export const FEATURES = [
  {
    title: '상담형 AI Agent',
    description: '여러 차례 대화를 이어가며 조건을 확인하고, 필요한 계산도구를 호출해 상담을 지원합니다.',
  },
  {
    title: '빠른 자연어 조건 추출',
    description: '상담 내용을 한 번에 입력하면 계산에 필요한 항목을 구조화합니다.',
  },
  {
    title: '추출값 확인 및 수정',
    description: 'AI 결과를 바로 계산에 사용하지 않고 직원이 확인·수정할 수 있습니다.',
  },
  {
    title: 'RTI 계산엔진',
    description: '적용금리와 스트레스금리를 반영해 현재 RTI와 목표 RTI 기준 한도를 계산합니다.',
  },
  {
    title: '월세별 예상 대출한도',
    description: '월 임대료 구간별 예상 대출금액을 비교표로 제공합니다.',
  },
  {
    title: '결과 저장과 초기화',
    description: '분석결과를 CSV로 다운로드하고 입력값과 계산조건을 구분해 초기화할 수 있습니다.',
  },
] as const;

export const FORMULAS = [
  '연간 임대료 = 월 임대료 × 12',
  '검토금리 = 적용금리 + 스트레스금리',
  '현재 RTI =\n연간 임대료 ÷\n(대출 희망금액 × 검토금리)',
  '목표 RTI 기준 최대 대출금액 =\n연간 임대료 ÷\n(목표 RTI × 검토금리)',
] as const;

export const CALC_STABILITY = [
  '핵심 계산은 순수 TypeScript 함수로 수행',
  'AI는 최종 숫자를 임의로 생성하지 않음',
  '동일 입력에 동일 결과 제공',
  '반올림·절사·올림 방식 선택 가능',
  '계산과 검증 관련 자동화 테스트 적용',
] as const;

export const PRIVACY_POINTS = [
  '고객명과 실제 상호 등 식별정보 입력 금지 안내',
  '주민등록번호·사업자등록번호·전화번호·이메일·계좌번호 추정 패턴 검사',
  '클라이언트와 서버 양쪽에서 검사',
  '민감정보 탐지 시 API 호출 차단',
  '자연어 입력 원문은 localStorage에 저장하지 않음',
  'API 키는 브라우저가 아니라 서버 환경변수에서 관리',
] as const;

export const ROADMAP_ITEMS = [
  '3개년 재무제표 파일 업로드',
  '주요 재무항목 자동 추출',
  '추출된 재무정보 사용자 검증',
  '매출·영업이익·차입금 추이 분석',
  '기업여신 사전검토 보고서 생성',
  '여러 담보물건 비교',
  '상담 결과 PDF 출력',
  '조직 인증과 이용 로그',
] as const;
