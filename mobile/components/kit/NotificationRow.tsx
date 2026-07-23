import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import type { AppNotification } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

function iconForType(type: string) {
  if (type.startsWith('admin_')) return AppIcons.notification.admin;
  if (type.includes('booking') || type.includes('confirmed')) return AppIcons.notification.booking;
  if (type.includes('complete') || type.includes('verified')) return AppIcons.notification.complete;
  return AppIcons.notification.default;
}

function formatWhen(createdAt?: string): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

function NotificationRowComponent({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress?: () => void;
}) {
  const Icon = iconForType(item.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.shell}>
        <GlassPanel
          style={[styles.row, !item.read && styles.unread]}
          padded={false}
          tone={item.read ? 'clear' : 'mint'}
          intensity={42}
          goldEdge={!item.read}
        >
          <View style={styles.inner}>
            <PremiumIcon
              icon={Icon}
              variant={item.read ? 'glass' : 'premium'}
              size="md"
              color={item.read ? colors.forest : '#FFFFFF'}
              boxSize={40}
            />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.createdAt ? <Text style={styles.when}>{formatWhen(item.createdAt)}</Text> : null}
              </View>
              <Text style={styles.bodyText} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
            {!item.read ? <View style={styles.dot} /> : null}
          </View>
        </GlassPanel>
      </View>
    </Pressable>
  );
}

export const NotificationRow = memo(NotificationRowComponent);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  shell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  row: {
    borderRadius: premium.radiusCard,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.forest,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontFamily: fonts.displayExtra, fontSize: 14, color: colors.ink, letterSpacing: -0.2 },
  when: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  bodyText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest,
    marginTop: 6,
  },
});
