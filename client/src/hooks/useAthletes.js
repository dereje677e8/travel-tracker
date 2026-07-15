import { useCallback, useEffect, useState } from 'react';
import { athleteApi } from '../api/athleteApi.js';

/**
 * Fetches a paginated, filtered athlete list. Reconciles with the server on
 * every param change and exposes a manual refetch for socket-driven updates.
 */
export function useAthletes(params) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await athleteApi.list(params);
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err.message || 'Failed to load athletes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, meta, loading, error, refetch };
}
