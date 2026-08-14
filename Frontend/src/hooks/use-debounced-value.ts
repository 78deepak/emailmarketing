import { useEffect, useState } from 'react';

/**
 * useDebouncedValue — delays propagating a rapidly-changing value.
 *
 * Classic use: a search input. Bind the input to a plain useState, but
 * feed the DEBOUNCED value into the query key. Result: API fires 300ms
 * after the user stops typing, not on every keystroke.
 *
 *   const [search, setSearch] = useState('');
 *   const debounced = useDebouncedValue(search, 300);
 *   const { data } = useContacts({ search: debounced });
 *
 * Cleanup fires on every change so no stale timer ever wins.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
