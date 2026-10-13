import { useState, useEffect } from 'react';

/**
 * Debounce hook to delay executing operations until a pause in typing
 * @param {any} value
 * @param {number} delay
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
