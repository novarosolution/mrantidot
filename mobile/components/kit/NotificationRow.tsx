import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import type { AppNotification } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type Look = { icon: LucideIcon; fg: string; bg: string };

const BRAND: Pick<Look, 'fg' | 'bg'> = { fg: ui.brand, bg: ui.brandSoft };

function lookForType(type: string): Look {
  if (type.startsWith('admin_')) return { icon: AppIcons.notification.admin, ...BRAND };
  if (type.includes('otp')) return { icon: AppIcons.ui.key, fg: '#A15C07', bg: '#FFF3E2' };
  if (type.includes('cancel')) return { icon: AppIcons.ui.close, fg: colors.error, bg: colors.errorBg };
  if (type.includes('complete')) return { icon: AppIcons.ui.shieldCheck, ...BRAND };
  if (type === 'awaiting_verification') return { icon: AppIcons.ui.listChecks, ...BRAND };
  if (type === 'work_started' || type === 'in_progress') return { icon: AppIcons.ui.sparkles, ...BRAND };
  if (type.includes('schedule') || type.includes('resched') || type === 'assigned' || type === 'confirmed') {
    return { icon: AppIcons.ui.calendarCheck, fg: colors.blue, bg: colors.blueBg };
  }
  return { icon: AppIcons.notification.default, ...BRAND };
}

function formatWhen(createdAt?: string): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Where a row sits inside a grouped (settings-style) card; omit for a standalone card. */
export type NotificationGroupPos = 'only' | 'first' | 'middle' | 'last';

function NotificationRowComponent({
  item,
  onPress,
  groupPos,
}: {
  item: AppNotification;
  onPress?: () => void;
  groupPos?: NotificationGroupPos;
}) {
  const look = lookForType(item.type);
  const Icon = look.icon;
  const grouped = groupPos != null;
  const unread = !item.read;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        grouped ? styles.row : styles.card,
        grouped && (groupPos === 'first' || groupPos === 'only') && styles.rowTop,
        grouped && (groupPos === 'last' || groupPos === 'only') && styles.rowBottom,
        !grouped && item.read && styles.cardRead,
        grouped && unread && styles.rowUnread,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
    >
      {grouped && groupPos !== 'first' && groupPos !== 'only' ? <View style={styles.divider} /> : null}
      <View style={[styles.tile, { backgroundColor: look.bg }, item.read && styles.tileRead]}>
        <Icon size={18} color={look.fg} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, item.read && styles.titleRead]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.createdAt ? <Text style={[styles.when, unread && styles.whenUnread]}>{formatWhen(item.createdAt)}</Text> : null}
          {unread ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {item.bookingId ? (
        <View style={styles.trail}>
          <ChevronRight size={16} color={ui.textTertiary} strokeWidth={2.2} />
        </View>
      ) : null}
    </Pressable>
  );
}

export const NotificationRow = memo(NotificationRowComponent);

const TILE = 42;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    marginBottom: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  cardRead: { backgroundColor: 'rgba(255,255,255,0.55)' },
  /** Grouped rows share one white card: side borders on every row, top/bottom on the ends. */
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: ui.hairline,
  },
  rowTop: { borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  rowBottom: { borderBottomWidth: 1, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  rowUnread: { backgroundColor: '#F7FBF7' },
  divider: {
    position: 'absolute',
    top: 0,
    left: 14 + TILE + 12,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.border,
  },
  pressed: { opacity: 0.85 },
  tile: { width: TILE, height: TILE, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileRead: { opacity: 0.75 },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.15, color: ui.text },
  titleRead: { fontFamily: fonts.bodySemi, color: ui.textSecondary },
  when: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  whenUnread: { color: ui.brand, fontFamily: fonts.bodySemi },
  bodyText: { marginTop: 3, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },
  trail: { alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.brandBright },
});
