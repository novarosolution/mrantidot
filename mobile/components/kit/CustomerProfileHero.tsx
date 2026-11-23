import type { LucideIcon } from 'lucide-react-native';
import { Bell, ChevronRight, Mail, MapPin, Phone, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import { HOME_HEADER_BOTTOM, HOME_HEADER_TOP } from '@/components/kit/HomeTopBar';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { colors, fonts, radii, typeScale, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { Skeleton } from '@/components/ui/Skeleton';

export type ProfileStat = {
  /** null while loading — shows a shimmer instead of a wrong number. */
  value: string | null;
  label: string;
  icon: LucideIcon;
  hot?: boolean;
  onPress: () => void;
};

function DetailLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Icon size={13} color={ui.textTertiary} strokeWidth={2.1} />
      <Text style={styles.detailText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Profile header — same mint header as home, identity card with contact lines and a stat strip. */
export function CustomerProfileHero({
  name,
  initial,
  city,
  phone,
  email,
  unread = 0,
  stats,
  onEdit,
  title,
  badge,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  name: string;
  initial: string;
  memberSince?: string;
  city?: string;
  phone?: string;
  email?: string;
  unread?: number;
  stats?: ProfileStat[];
  onEdit: () => void;
  onCopy?: (label: string, value: string) => void;
  /** Small pill under the top row (e.g. "Incomplete profile" + Complete). */
  badge?: React.ReactNode;
}) {
  const copy = useCustomerUiCopy();
  const hasDetails = Boolean(phone || email || city);

  return (
    <View style={styles.wrap}>
      <FocusStatusBar style="dark" />
      <LinearGradient
        colors={[HOME_HEADER_TOP, HOME_HEADER_BOTTOM]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <PremiumAurora tone="light" base={false} topFade />

      <View style={styles.topRow}>
        <Text style={styles.title} accessibilityRole="header">
          {title ?? copy.profileScreenTitle}
        </Text>
        <PressableScale
          scaleTo={0.92}
          onPress={() => appPush(customerRoutes.notifications)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? fillCopy(copy.profileNotificationsA11y, { count: unread }) : copy.profileMenuNotifications}
        >
          <GlassSurface style={styles.iconBtn} intensity={30} tintOpacity={0.78}>
            <Bell size={20} color={ui.text} strokeWidth={2} />
          </GlassSurface>
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </PressableScale>
        <PressableScale
          scaleTo={0.92}
          onPress={() => appPush(customerRoutes.settings)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={copy.profileMenuSettings}
        >
          <GlassSurface style={styles.iconBtn} intensity={30} tintOpacity={0.78}>
            <Settings size={20} color={ui.text} strokeWidth={2} />
          </GlassSurface>
        </PressableScale>
      </View>

      {badge}

      <View style={styles.card}>
        <PressableScale
          style={styles.identity}
          scaleTo={0.985}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={fillCopy(copy.profileEditA11y, { name })}
        >
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={[colors.forestMid, colors.forest]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {hasDetails ? (
              <View style={styles.details}>
                {phone ? <DetailLine icon={Phone} text={phone} /> : null}
                {email ? <DetailLine icon={Mail} text={email} /> : null}
                {city ? <DetailLine icon={MapPin} text={city} /> : null}
              </View>
            ) : (
              <Text style={styles.addDetails}>{copy.profileAddDetails}</Text>
            )}
          </View>
          <ChevronRight size={20} color={ui.textTertiary} strokeWidth={2.2} />
        </PressableScale>

        {stats && stats.length > 0 ? (
          <View style={styles.statsRow}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <PressableScale
                  key={s.label}
                  containerStyle={[styles.statWrap, i > 0 && styles.statBorder]}
                  style={styles.stat}
                  scaleTo={0.96}
                  onPress={s.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={s.value == null ? s.label : `${s.value} ${s.label}`}
                >
                  <View style={styles.statTop}>
                    <Icon size={15} color={ui.brand} strokeWidth={2.2} />
                    {s.value == null ? (
                      <Skeleton width={22} height={18} radius={6} />
                    ) : (
                      <Text style={styles.statVal}>{s.value}</Text>
                    )}
                  </View>
                  <Text style={styles.statLb} numberOfLines={1}>
                    {s.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 18, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { ...typeScale.display, flex: 1, color: ui.text },
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
  pressed: { opacity: 0.75 },

  card: {
    borderRadius: radii.card,
    backgroundColor: colors.white,
    ...ui.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatarRing: {
    padding: 3,
    borderRadius: 36,
    backgroundColor: ui.brandSoft,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.white },
  identityBody: { flex: 1, minWidth: 0 },
  name: { ...typeScale.section, fontSize: 19, lineHeight: 24, color: ui.text },
  details: { marginTop: 5, gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textSecondary },
  addDetails: { marginTop: 4, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  statWrap: { flex: 1 },
  stat: { alignItems: 'center', paddingVertical: 14, gap: 3 },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ui.border },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.4, color: ui.text },
  statLb: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
});
