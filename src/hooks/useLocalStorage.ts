import { useCallback, useState } from 'react';

/**
 * localStorage와 동기화되는 상태를 관리하는 훅.
 * 저장된 값이 없거나 파싱에 실패하거나 validator를 통과하지 못하면 기본값을 사용한다.
 */
export function useLocalStorage<T>(key: string, defaultValue: T, validator?: (value: unknown) => boolean) {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;

      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) {
        return defaultValue;
      }
      return parsed as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue, validator]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // localStorage 저장 실패(용량 초과, 프라이버시 모드 등)는 조용히 무시한다.
        }
        return next;
      });
    },
    [key],
  );

  const resetValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // 무시
    }
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, resetValue] as const;
}
