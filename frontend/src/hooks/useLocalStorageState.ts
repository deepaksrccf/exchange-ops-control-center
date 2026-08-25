import { useEffect, useState } from "react";

/** Persists a small JSON-serializable preference value to localStorage (never event/API data). */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable (private browsing, quota); preferences are non-critical.
    }
  }, [key, value]);

  return [value, setValue];
}
