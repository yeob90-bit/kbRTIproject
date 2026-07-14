import type { RoundingMode } from '../types/loan.js';

/**
 * 지정된 단위(기본 100만원)로 값을 반올림/절사/올림 처리한다.
 * 음수, 비유한수, 잘못된 단위 값은 0으로 처리한다.
 */
export function roundToUnit(value: number, unit = 1_000_000, mode: RoundingMode = 'round'): number {
  if (!Number.isFinite(value) || value < 0 || unit <= 0) {
    return 0;
  }

  switch (mode) {
    case 'floor':
      return Math.floor(value / unit) * unit;

    case 'ceil':
      return Math.ceil(value / unit) * unit;

    default:
      return Math.round(value / unit) * unit;
  }
}

export const ROUNDING_MODE_LABELS: Record<RoundingMode, string> = {
  round: '100만원 단위 반올림',
  floor: '100만원 단위 절사',
  ceil: '100만원 단위 올림',
};
