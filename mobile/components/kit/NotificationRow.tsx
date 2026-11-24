import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import type { CustomerUiCopy } from '@/types/api';
import type { LucideIcon } from 'lucide-react-native';
import { ArrowRight, ChevronRight, ExternalLink, Megaphone } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import type { AppNotification } from '@/types/api';
import { colors, fonts, radii, spacing, typeScale, ui } from '@/constants/theme';

type Look = { icon: LucideIcon; fg: string; bg: string };

const BRAND: Pick<Look, 'fg' | 'bg'> = { fg: ui.brand, bg: ui.brandSoft };

function lookForType(type: string): Look {
  if (type === 'broadcast') return { icon: Megaphone, fg: colors.amberInk, bg: colors.amberBg };
  if (type.startsWith('admin_')) return { icon: AppIcons.notification.admin, ...BRAND };
  if (type.includes('otp')) return { icon: AppIcons.ui.key, fg: colors.amberInk, bg: colors.amberBg };
  if (type.includes('cancel')) return { icon: AppIcons.ui.close, fg: colors.error, bg: colors.errorBg };
  if (type.includes('complete')) return { icon: AppIcons.ui.shieldCheck, ...BRAND };
  if (type === 'awaiting_verification') return { icon: AppIcons.ui.listChecks, ...BRAND };
  if (type === 'work_started' || type === 'in_progress') return { icon: AppIcons.ui.sparkles, ...BRAND };
  if (type.includes('schedule') || type.includes('resched') || type === 'assigned' || type === 'confirmed') {
    return { icon: AppIcons.ui.calendarCheck, fg: colors.blue, bg: colors.blueBg };
  }
  return { icon: AppIcons.notification.default, ...BRAND };
}

type WhenCopy = Pick<CustomerUiCopy, 'timeJustNow' | 'timeMinutesAgo' | 'timeHoursAgo' | 'timeYesterday'>;

function formatWhen(createdAt: string | undefined, copy: WhenCopy): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return copy.timeJustNow;
  if (mins < 60) return fillCopy(copy.timeMinutesAgo, { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return fillCopy(copy.timeHoursAgo, { count: hrs });
  if (hrs < 48) return copy.timeYesterday;
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
  const copy = useCustomerUiCopy();
  const look = lookForType(item.type);
  const Icon = look.icon;
  const grouped = groupPos != null;
  const unread = !item.read;
  const when = formatWhen(item.createdAt, copy);
  // Booking updates open the booking; otherwise an admin link (service / offers / web page) gets a pill.
  const link = item.bookingId ? null : (item.link ?? null);
  const linkText = link
    ? link.kind === 'offers'
      ? copy.notifLinkOffers
      : link.label?.trim() || (link.kind === 'service' ? copy.notifLinkService : copy.notifLinkUrl)
    : null;
  const LinkIcon = link?.kind === 'url' ? ExternalLink : ArrowRight;

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.985}
      style={[
        grouped ? styles.row : styles.card,
        grouped && (groupPos === 'first' || groupPos === 'only') && styles.rowTop,
        grouped && (groupPos === 'last' || groupPos === 'only') && styles.rowBottom,
        !grouped && item.read && styles.cardRead,
        grouped && unread && styles.rowUnread,
      ]}
      accessibilityRole="button"
      accessibilityLabel={[unread ? copy.notificationsUnreadA11y : null, item.title, item.body, linkText, when].filter(Boolean).join('. ')}
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
          {when ? <Text style={[styles.when, unread && styles.whenUnread]}>{when}</Text> : null}
          {unread ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.bodyText} numberOfLines={2}>
          {item.body}
        </Text>
        {linkText ? (
          <View style={styles.linkPill}>
            <LinkIcon size={12} color={ui.brand} strokeWidth={2.4} />
            <Text style={styles.linkText} numberOfLines={1}>
              {linkText}
            </Text>
          </View>
        ) : null}
      </View>
      {item.bookingId || link ? (
        <View style={styles.trail}>
          <ChevronRight size={16} color={ui.textTertiary} strokeWidth={2.2} />
        </View>
      ) : null}
    </PressableScale>
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
    borderRadius: radii.card,
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
  rowTop: { borderTopWidth: 1, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card },
  rowBottom: { borderBottomWidth: 1, borderBottomLeftRadius: radii.card, borderBottomRightRadius: radii.card },
  rowUnread: { backgroundColor: ui.canvas },
  divider: {
    position: 'absolute',
    top: 0,
    left: 14 + TILE + 12,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.border,
  },
  tile: { width: TILE, height: TILE, borderRadius: radii.thumb, alignItems: 'center', justifyContent: 'center' },
  tileRead: { opacity: 0.75 },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typeScale.rowTitle, fontFamily: fonts.bodyBold, flex: 1, color: ui.text },
  titleRead: { fontFamily: fonts.bodySemi, color: ui.textSecondary },
  when: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  whenUnread: { color: ui.brand, fontFamily: fonts.bodySemi },
  bodyText: { ...typeScale.caption, marginTop: 3, color: ui.textSecondary },
  trail: { alignSelf: 'center' },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    maxWidth: '100%',
    marginTop: 8,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: ui.brandSoft,
  },
  linkText: { ...typeScale.captionStrong, fontSize: 12, flexShrink: 1, color: ui.brand },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ui.brandBright },
});
