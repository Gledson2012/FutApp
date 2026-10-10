import { useCallback, useEffect, useState } from 'react';
import { invalidateCache } from '../services/api';

/** Resultado padronizado de qualquer fetch de tela */
export interface ApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  retry: () => void;
}

/**
 * Hook genérico de fetch: loading, erro amigável + retry (limpa cache),
 * pull-to-refresh. Evita repetir try/catch em todas as telas.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const refresh = useCallback(() => {
    invalidateCache();
    setNonce((n) => n + 1);
  }, []);

  const retry = useCallback(() => {
    invalidateCache();
    setNonce((n) => n + 1);
  }, []);

  return { data, loading, error, refresh, retry };
}
