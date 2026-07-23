import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, headerTopPad, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export type ProfileStat = {
  value: string;
  label: string;
  icon: LucideIcon;
  hot?: boolean;
  onPress: () => void;
};

/** Profile header — same forest hero language as home. */
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
  const insets = useSafeAreaInsets();
  const line = [city?.trim(), phone?.trim()].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      <HeroDarkSlice
        style={styles.heroShell}
        contentStyle={[styles.heroContent, { paddingTop: headerTopPad(insets.top) }]}
        sliceHeight={22}
        sliceColor={surfaces.glassScreenBase}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={() => appPush(customerRoutes.notifications)}
              hitSlop={8}
              accessibilityLabel="Notifications"
            >
              <PremiumIcon
                icon={AppIcons.ui.bell}
                variant="plain"
                size={18}
                color="#FFFFFF"
                strokeWidth={2}
                fill="rgba(255,255,255,0.22)"
              />
              {unread > 0 ? <View style={styles.badge} /> : null}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              onPress={onEdit}
              hitSlop={8}
              accessibilityLabel="Settings"
            >
              <PremiumIcon
                icon={AppIcons.ui.settings}
                variant="plain"
                size={18}
                color="#FFFFFF"
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.identity, pressed && styles.pressed]} onPress={onEdit}>
          <View style={styles.avatarShell}>
            <LinearGradient
              colors={['#E8F9D4', '#8FD03C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.9, y: 1 }}
            />
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityBody}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {line ? (
              <Text style={styles.meta} numberOfLines={1}>
                {line}
              </Text>
            ) : email ? (
              <Text style={styles.meta} numberOfLines={1}>
                {email}
              </Text>
            ) : (
              <Text style={styles.metaHint}>Add your details</Text>
            )}
          </View>
          <View style={styles.editChip}>
            <Text style={styles.editChipText}>Edit</Text>
          </View>
        </Pressable>
      </HeroDarkSlice>

      {stats && stats.length > 0 ? (
        <View style={styles.statsOuter}>
          <GlassPanel style={styles.statsCard} padded={false} tone="light" goldEdge>
            <View style={styles.statsRow}>
              {stats.map((s, i) => (
                <Pressable
                  key={s.label}
                  style={({ pressed }) => [styles.stat, i > 0 && styles.statBorder, pressed && styles.pressed]}
                  onPress={s.onPress}
                >
                  <PremiumIcon icon={s.icon} variant="mint" size={14} color={colors.forest} boxSize={28} />
                  <Text style={styles.statVal}>{s.value}</Text>
                  <Text style={styles.statLb}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </GlassPanel>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  heroShell: {
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    letterSpacing: -0.9,
    color: '#FFFFFF',
  },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8F07A',
    borderWidth: 1.5,
    borderColor: '#0A6423',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarShell: {
    width: 64,
    height: 64,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarText: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  identityBody: { flex: 1, minWidth: 0, gap: 4 },
  name: {
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    letterSpacing: -0.35,
    color: '#FFFFFF',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.78)',
  },
  metaHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: 'rgba(200,240,122,0.9)',
  },
  editChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  editChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: '#FFFFFF',
  },

  statsOuter: {
    marginTop: -22,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  statsCard: {
    borderRadius: 22,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  statBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(10,100,35,0.12)',
  },
  statVal: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.forest,
  },
  statLb: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
});
