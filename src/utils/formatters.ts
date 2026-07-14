const numberFormatter = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rtiFormatter = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 원 단위 숫자를 3자리 구분 기호가 포함된 문자열로 표시 */
export function formatWon(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${numberFormatter.format(Math.round(value))}원`;
}

/** 원 단위 숫자를 억원 단위로 환산하여 소수점 2자리까지 표시 */
export function formatEok(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  const eok = value / 100_000_000;
  return `${eok.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}억원`;
}

/** 퍼센트 값을 소수점 2자리까지 표시 (예: 4.10%) */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${percentFormatter.format(value)}%`;
}

/** 비율(배수) 값을 소수점 2자리까지 표시 (예: 1.50배) */
export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return `${rtiFormatter.format(value)}배`;
}

/** 순수 숫자를 3자리 구분 기호 문자열로 표시 (단위 없음) */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  return numberFormatter.format(Math.round(value));
}

/** 원 단위 숫자를 만원 단위로 반올림하여 표시 (예: 2,905만원) */
export function formatManwon(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  const manwon = Math.round(value / 10_000);
  return `${numberFormatter.format(manwon)}만원`;
}

/** 부호를 포함한 억원 표시 (양수는 +, 음수는 -) */
export function formatSignedEok(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  const eok = value / 100_000_000;
  return `${sign}${eok.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}억원`;
}
