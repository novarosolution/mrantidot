import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { api, screenLoadConfig } from '@/lib/api';
import type { WebsiteSummary } from '@/types/api';

/** Website counts (new messages badge, posts, drafts…) — refetched on focus once older than `staleMs`. */
export function useWebsiteSummary(staleMs = 30_000) {
  const [summary, setSummary] = useState<WebsiteSummary | null>(null);
  const lastFetch = useRef(0);

  const refresh = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && now - lastFetch.current < staleMs) return;
      lastFetch.current = now;
      try {
        const { data } = await api.get<{ summary: WebsiteSummary }>('/website/admin/summary', {
          ...screenLoadConfig,
          skipCache: true,
        });
        setSummary(data.summary);
      } catch {
        // Keep the last numbers; the badge is a nicety.
      }
    },
    [staleMs],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { summary, refresh: () => refresh(true) };
}
