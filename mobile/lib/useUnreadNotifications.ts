import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';

/** Poll unread notification count for header badges (cached + throttled). */
export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const lastFetch = useRef(0);

  const refreshUnread = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch.current < CACHE_TTL.notifications) return;
    lastFetch.current = now;
    try {
      const { data } = await api.get<{ unreadCount?: number }>('/notifications', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.notifications,
      });
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  return { unreadCount, refreshUnread: () => refreshUnread(true) };
}
