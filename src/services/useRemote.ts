import { useCallback, useEffect, useRef, useState } from 'react';

export function useRemote<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedFor, setLoadedFor] = useState(() => loader);
  const generation = useRef(0);
  const reload = useCallback(async (background = false) => {
    const current = ++generation.current;
    if (!background) setLoading(true); setError('');
    try { const result = await loader(); if (current === generation.current) setData(result); }
    catch (reason) { if (current === generation.current) setError(reason instanceof Error ? reason.message : 'Không tải được dữ liệu'); }
    finally { if (current === generation.current) { setLoadedFor(() => loader); setLoading(false); } }
  }, [loader]);
  const invalidate = useCallback(() => { generation.current++; }, []);
  useEffect(() => {
    const timer = setTimeout(() => void reload(), 0);
    return () => { clearTimeout(timer); invalidate(); };
  }, [reload, invalidate]);
  return { data, setData, loading: loading || loadedFor !== loader, error, reload };
}
