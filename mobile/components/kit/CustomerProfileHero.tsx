import type { LucideIcon } from 'lucide-react-native';
import { Bell, ChevronRight, Mail, MapPin, Phone, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import { HOME_HEADER_BOTTOM, HOME_HEADER_TOP } from '@/components/kit/HomeTopBar';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { colors, fonts, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export type ProfileStat = {
  value: string;
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
}) {
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
        <Text style={styles.title}>Profile</Text>
        <PressableScale
          scaleTo={0.92}
          onPress={() => appPush(customerRoutes.notifications)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
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
          accessibilityLabel="Settings"
        >
          <GlassSurface style={styles.iconBtn} intensity={30} tintOpacity={0.78}>
            <Settings size={20} color={ui.text} strokeWidth={2} />
          </GlassSurface>
        </PressableScale>
      </View>

      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.identity, pressed && styles.identityPressed]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`${name}. Edit profile`}
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
              <Text style={styles.addDetails}>Add your phone and email</Text>
            )}
          </View>
          <ChevronRight size={20} color={ui.textTertiary} strokeWidth={2.2} />
        </Pressable>

        {stats && stats.length > 0 ? (
          <View style={styles.statsRow}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <Pressable
                  key={s.label}
                  style={({ pressed }) => [styles.stat, i > 0 && styles.statBorder, pressed && styles.statPressed]}
                  onPress={s.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.value} ${s.label}`}
                >
                  <View style={styles.statTop}>
                    <Icon size={15} color={ui.brand} strokeWidth={2.2} />
                    <Text style={styles.statVal}>{s.value}</Text>
                  </View>
                  <Text style={styles.statLb} numberOfLines={1}>
                    {s.label}
                  </Text>
                </Pressable>
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
  title: {
    flex: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: ui.text,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    borderRadius: 22,
    backgroundColor: colors.white,
    ...ui.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  identityPressed: { opacity: 0.85 },
  avatarRing: {
    padding: 3,
    borderRadius: 36,
    backgroundColor: ui.brandSoft,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.white },
  identityBody: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: ui.text,
  },
  details: { marginTop: 5, gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textSecondary },
  addDetails: { marginTop: 4, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ui.border },
  statPressed: { backgroundColor: ui.surfaceMuted },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.4, color: ui.text },
  statLb: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
});
