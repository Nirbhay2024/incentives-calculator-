import { useCallback, useEffect, useState } from 'react';

// Shared "fetch on mount, expose loading/error, allow manual reload" hook —
// every admin page needs this now that storage.js hits a real API instead
// of reading localStorage synchronously.
export function useAsyncData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const reload = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message || 'Failed to load.' });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}
