import { useEffect, useState } from 'react';

export function useData<T>(url: string) {
  const [state, setState] = useState<{ data: T | null; error: boolean }>({ data: null, error: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: false });
    fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    }).then(data => setState({ data, error: false })).catch(error => {
      if (error.name !== 'AbortError') setState({ data: null, error: true });
    });
    return () => controller.abort();
  }, [url, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
