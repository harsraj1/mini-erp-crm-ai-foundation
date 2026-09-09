import { useEffect, useState } from 'react';
import { errorMessage } from '../api/client';

export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setData(null);
    void load().then((value) => { if (active) setData(value); })
      .catch((err: unknown) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, version]);
  return { data, loading, error, retry: () => setVersion((value) => value + 1), setData };
}
