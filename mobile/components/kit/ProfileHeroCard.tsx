import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Copy,
  Mail,
  MapPin,
  Phone,
  Settings,
} from 'lucide-react-native';
import { appToast } from '@/lib/toast';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts, gradients, headerTopPad, premium, shadows, spacing } from '@/constants/theme';

function digits(v: string) {
  return v.replace(/[^\d+]/g, '');
}

export function ProfileHeroCard({
  name,
  phone,
  email,
  city,
  memberSince,
  unread = 0,
  verified = true,
}: {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  memberSince?: string;
  unread?: number;
  verified?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const initial = name[0]?.toUpperCase() ?? 'U';

  async function copyText(label: string, value: string) {
    await Clipboard.setStringAsync(value);
    appToast.success(`${label} copied`);
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#2BB563', '#1A6B3C', '#0E3A20']}
        style={[styles.hero, { paddingTop: headerTopPad(insets.top) }]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.screenTitle}>My account</Text>
            <Text style={styles.screenSub}>Manage your profile & preferences</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.heroIconBtn} onPress={() => router.push('/(customer)/notifications')}>
              <Bell size={18} color={colors.white} strokeWidth={2} />
              {unread > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.heroIconBtn} onPress={() => router.push('/(customer)/settings')}>
              <Settings size={18} color={colors.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardOuter}>
        <View style={styles.card}>
          <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </LinearGradient>

          {verified ? (
            <View style={styles.verifiedBadge}>
              <BadgeCheck size={13} color={colors.forest} strokeWidth={2.2} />
              <Text style={styles.verifiedText}>Verified customer</Text>
            </View>
          ) : null}

          <Text style={styles.name}>{name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>Customer</Text>
          </View>
          {memberSince ? <Text style={styles.member}>{memberSince}</Text> : null}

          <View style={styles.meta}>
            {city ? (
              <View style={styles.metaChip}>
                <MapPin size={13} color={colors.forest} />
                <Text style={styles.metaText}>{city}</Text>
              </View>
            ) : null}
            {phone ? (
              <View style={styles.metaChip}>
                <Pressable style={styles.metaPress} onPress={() => Linking.openURL(`tel:${digits(phone)}`)}>
                  <Phone size={13} color={colors.forest} />
                  <Text style={styles.metaText}>{phone}</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => void copyText('Phone', phone)}>
                  <Copy size={14} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            {email ? (
              <View style={styles.metaChip}>
                <Pressable style={styles.metaPress} onPress={() => Linking.openURL(`mailto:${email}`)}>
                  <Mail size={13} color={colors.forest} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {email}
                  </Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => void copyText('Email', email)}>
                  <Copy size={14} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
          </View>

          <Pressable style={styles.editRow} onPress={() => router.push('/(customer)/settings')}>
            <Text style={styles.editLabel}>Edit profile & account</Text>
            <ChevronRight size={16} color={colors.lime} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: 64,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  glowB: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  screenTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.4,
  },
  screenSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.forest,
  },
  notifBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  cardOuter: {
    marginTop: -52,
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    paddingTop: spacing.lg + 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    ...shadows.floating,
  },
  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 30,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 34, color: colors.white },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.15)',
  },
  verifiedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.ink,
    marginTop: spacing.sm,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  rolePill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.greyBg,
  },
  roleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  member: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  meta: {
    width: '100%',
    marginTop: spacing.md,
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.forest,
    alignSelf: 'stretch',
  },
  editLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
  },
});
