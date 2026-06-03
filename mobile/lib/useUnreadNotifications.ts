import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { api, screenLoadConfig } from '@/lib/api';

/** Poll unread notification count for header badges. */
export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await api.get<{ unreadCount?: number }>('/notifications', screenLoadConfig);
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

  return { unreadCount, refreshUnread };
}
