import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
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
    return { icon: AppIcons.ui.calendarCheck, ...BRAND };
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

function NotificationRowComponent({ item, onPress }: { item: AppNotification; onPress?: () => void }) {
  const look = lookForType(item.type);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, item.read && styles.cardRead, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
    >
      <View style={[styles.tile, { backgroundColor: look.bg }, item.read && styles.tileRead]}>
        <PremiumIcon icon={look.icon} variant="plain" size={18} color={look.fg} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, item.read && styles.titleRead]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.createdAt ? <Text style={styles.when}>{formatWhen(item.createdAt)}</Text> : null}
          {!item.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
    </Pressable>
  );
}

export const NotificationRow = memo(NotificationRowComponent);

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
  pressed: { opacity: 0.9 },
  tile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileRead: { opacity: 0.7 },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.displaySemi, fontSize: 14.5, letterSpacing: -0.2, color: ui.text },
  titleRead: { fontFamily: fonts.bodySemi, color: ui.textSecondary },
  when: { fontFamily: fonts.body, fontSize: 11, color: ui.textTertiary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.brand },
  bodyText: { marginTop: 4, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
});
