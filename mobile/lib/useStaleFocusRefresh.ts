import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/** Refetch on focus only if data is older than staleMs (default 30s). Skips the first focus (initial mount). */
export function useStaleFocusRefresh(effect: () => void | Promise<void>, staleMs = 30_000) {
  const lastRun = useRef(0);
  const skippedFirst = useRef(false);
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useFocusEffect(
    useCallback(() => {
      if (!skippedFirst.current) {
        skippedFirst.current = true;
        lastRun.current = Date.now();
        return;
      }
      const now = Date.now();
      if (now - lastRun.current < staleMs) return;
      lastRun.current = now;
      void effectRef.current();
    }, [staleMs]),
  );
}
