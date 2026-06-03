import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, Calendar, CheckCircle } from 'lucide-react-native';
import type { AppNotification } from '@/types/api';
import { colors, design, fonts, premium, spacing } from '@/constants/theme';

function iconForType(type: string) {
  if (type.startsWith('admin_')) return Bell;
  if (type.includes('booking') || type.includes('confirmed')) return Calendar;
  if (type.includes('complete') || type.includes('verified')) return CheckCircle;
  return Bell;
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

export function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress?: () => void;
}) {
  const Icon = iconForType(item.type);

  return (
    <Pressable
      style={[styles.row, !item.read && styles.unread]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
        <Icon size={18} color={colors.green} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.createdAt ? <Text style={styles.when}>{formatWhen(item.createdAt)}</Text> : null}
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: design.linkColor,
    borderColor: colors.border,
    backgroundColor: colors.secondarySoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: colors.white },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  when: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  bodyText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: design.linkColor,
    marginTop: 6,
  },
});
