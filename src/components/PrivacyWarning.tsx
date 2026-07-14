import { PRIVACY_BANNER_MESSAGE } from '../utils/privacy';

export function PrivacyWarning() {
  return (
    <div
      role="note"
      aria-label="개인정보 입력 금지 안내"
      className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
    >
      <p className="font-semibold">입력 시 주의사항</p>
      <p className="mt-1">{PRIVACY_BANNER_MESSAGE}</p>
    </div>
  );
}
