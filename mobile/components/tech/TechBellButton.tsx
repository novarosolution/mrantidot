import { useFocusEffect } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { colors, fonts, radii, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { appPush, techRoutes } from '@/lib/routes';

/** How often the badge re-checks while the screen stays open; the API cache absorbs most of these. */
const POLL_MS = 60_000;

/**
 * Bell for the technician's jobs header: unread badge, opens the inbox.
 * Asks for counts only (`limit=0`). Reading or deleting in the inbox clears the `/notifications`
 * API cache, so the badge is fresh when this screen is focused again.
 */
export function TechBellButton() {
  const copy = useCustomerUiCopy();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const load = async () => {
        try {
          const { data } = await api.get<{ unreadCount?: number }>('/notifications', {
            ...screenLoadConfig,
            params: { limit: 0 },
            cacheTtlMs: CACHE_TTL.notifications,
          });
          if (alive) setUnread(data.unreadCount ?? 0);
        } catch {
          // Keep the last count; the next focus or poll tries again.
        }
      };
      void load();
      const timer = setInterval(() => void load(), POLL_MS);
      return () => {
        alive = false;
        clearInterval(timer);
      };
    }, []),
  );

  return (
    <PressableScale
      scaleTo={0.92}
      haptic="tap"
      onPress={() => appPush(techRoutes.notifications)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0 ? fillCopy(copy.techNotificationsBellUnread, { count: unread }) : copy.techNotificationsBell
      }
    >
      <GlassSurface style={styles.iconBtn} intensity={30} tintOpacity={0.78}>
        <Bell size={20} color={ui.text} strokeWidth={2} />
      </GlassSurface>
      {unread > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/** Same glass button and red count badge as the customer profile bell. */
const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: colors.white },
});
