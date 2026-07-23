import { InteractionManager } from 'react-native';
import { useCallback, useState } from 'react';
import { getApiErrorMessage } from './api';

/** Run after navigation/animations settle — keeps first paint snappy. */
export function afterInteractions<T>(fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      try {
        Promise.resolve(fn()).then(resolve, reject);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function useScreenLoad(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const runLoad = useCallback(
    async (
      fn: () => Promise<void>,
      fallbackMessage = 'Something went wrong',
      opts?: { defer?: boolean },
    ) => {
      const exec = async () => {
        try {
          setError(null);
          await fn();
        } catch (err) {
          setError(getApiErrorMessage(err, fallbackMessage));
        } finally {
          setLoading(false);
        }
      };
      if (opts?.defer) {
        await afterInteractions(exec);
      } else {
        await exec();
      }
    },
    [],
  );

  const reload = useCallback(
    async (fn: () => Promise<void>, fallbackMessage?: string) => {
      setLoading(true);
      await runLoad(fn, fallbackMessage ?? 'Something went wrong');
    },
    [runLoad],
  );

  const refresh = useCallback(
    async (fn: () => Promise<void>, fallbackMessage = 'Could not refresh') => {
      setRefreshing(true);
      try {
        setError(null);
        await fn();
      } catch (err) {
        setError(getApiErrorMessage(err, fallbackMessage));
      } finally {
        setRefreshing(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    refreshing,
    setLoading,
    setError,
    runLoad,
    reload,
    refresh,
  };
}
