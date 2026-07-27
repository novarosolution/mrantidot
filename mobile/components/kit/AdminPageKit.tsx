import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { AdminGoldBar } from '@/components/kit/AdminScreenKit';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { ADMIN_QUICK_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { adminSurfaces, adminType, colors, premium, spacing } from '@/constants/theme';

export function AdminQuickGrid({
  items,
  onPress,
}: {
  items: { key: string; icon: LucideIcon; label: string }[];
  onPress: (key: string) => void;
}) {
  const tileWidth = adminGridCellWidth(ADMIN_QUICK_COLS);

  return (
    <View style={styles.quickGrid}>
      {items.map(({ key, icon: Icon, label }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [{ width: tileWidth }, pressed && styles.pressed]}
          onPress={() => onPress(key)}
        >
          <View style={styles.quickShell}>
            <GlassPanel style={styles.quickTile} padded={false} tone="clear" intensity={40} goldEdge>
              <View style={styles.quickInner}>
                <PremiumIcon icon={Icon} variant="premium" size={18} color="#FFFFFF" boxSize={44} />
                <Text style={styles.quickLabel} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </GlassPanel>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function AdminFilterChips({
  chips,
  selected,
  onSelect,
}: {
  chips: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={styles.chipsWrap}>
      {chips.map((c) => {
        const active = selected === c.key;
        return (
          <Pressable
            key={c.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(c.key)}
            style={({ pressed }) => [pressed && styles.chipPressed]}
          >
            {active ? (
              <View style={styles.chipActiveShell}>
                <LinearGradient
                  colors={['#8FD03C', '#1A8734', '#0A6423']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.chip, styles.chipActive]}
                >
                  <Text style={[styles.chipText, styles.chipTextActive]}>{c.label}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Unified stats row for admin list screens. */
export function AdminStatStrip({
  items,
  flush,
}: {
  items: { label: string; value: string | number; color?: string }[];
  flush?: boolean;
}) {
  return (
    <View style={[styles.stripOuter, flush && styles.stripFlush]}>
      <View style={styles.stripShell}>
        <GlassPanel style={styles.stripWrap} padded={false} tone="clear" intensity={40} goldEdge>
          <View style={styles.stripRow}>
            {items.map((item, index) => (
              <View key={item.label} style={[styles.stripCell, index < items.length - 1 && styles.stripBorder]}>
                <Text style={[styles.stripValue, { color: item.color ?? colors.forest }]}>{item.value}</Text>
                <Text style={styles.stripLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 10,
    marginTop: spacing.sm,
    width: '100%',
  },
  quickShell: {
    borderRadius: 18,
    ...adminShadow.tile,
  },
  quickTile: {
    borderRadius: 18,
  },
  quickInner: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingTop: spacing.sm + 8,
    gap: 8,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  quickLabel: { ...adminType.quickLabel, color: colors.ink },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: adminSurfaces.chipBg,
    borderWidth: 1,
    borderColor: adminSurfaces.chipBorder,
  },
  chipActiveShell: {
    borderRadius: 999,
    ...adminShadow.soft,
  },
  chipActive: {
    borderWidth: 0,
  },
  chipPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  chipText: { ...adminType.chipText, color: colors.ink },
  chipTextActive: { color: colors.white },
  stripOuter: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  stripFlush: { marginHorizontal: 0 },
  stripShell: {
    borderRadius: premium.radiusCard,
    ...adminShadow.card,
  },
  stripWrap: {
    borderRadius: premium.radiusCard,
  },
  stripRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  stripCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stripBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: adminSurfaces.cardBorder,
  },
  stripValue: { ...adminType.statValue, color: colors.ink },
  stripLabel: { ...adminType.statLabel, marginTop: 2, color: colors.muted },
});

/** Glass form surface with gold top accent — used on content & edit screens. */
export function AdminFormCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View style={formStyles.shell}>
      <GlassPanel style={[formStyles.card, style]} padded={false} tone="light" intensity={48} goldEdge>
        <View style={formStyles.inner}>{children}</View>
      </GlassPanel>
    </View>
  );
}

const formStyles = StyleSheet.create({
  shell: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: premium.radiusCard,
    ...adminShadow.card,
  },
  card: {
    borderRadius: premium.radiusCard,
  },
  inner: {
    padding: spacing.md,
  },
});

/** Hint banner shown under content tabs. */
export function AdminTabHint({ title, body }: { title: string; body: string }) {
  return (
    <View style={hintStyles.wrap}>
      <View style={hintStyles.shell}>
        <GlassPanel style={hintStyles.card} padded={false} tone="mint" intensity={40} goldEdge>
          <View style={hintStyles.inner}>
            <View style={hintStyles.iconWrap}>
              <PremiumIcon icon={AppIcons.ui.info} variant="plain" size={14} color={colors.forest} strokeWidth={2.4} />
            </View>
            <View style={hintStyles.textCol}>
              <Text style={hintStyles.title}>{title}</Text>
              <Text style={hintStyles.body}>{body}</Text>
            </View>
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

/** Collapsible form group — keeps long admin forms easy to scan. */
export function AdminCollapsibleCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={collapseStyles.shell}>
      <GlassPanel style={collapseStyles.wrap} padded={false} tone="light" intensity={46} goldEdge>
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [collapseStyles.head, pressed && collapseStyles.pressed]}
        >
          <View style={collapseStyles.headText}>
            <Text style={collapseStyles.title}>{title}</Text>
            {subtitle ? <Text style={collapseStyles.sub}>{subtitle}</Text> : null}
          </View>
          <View style={collapseStyles.chevron}>
            <PremiumIcon
              icon={AppIcons.ui.chevronDown}
              variant="plain"
              size={16}
              color={colors.forest}
              strokeWidth={2.5}
              style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
            />
          </View>
        </Pressable>
        {open ? (
          <View style={collapseStyles.body}>
            <AdminGoldBar height={2} style={collapseStyles.gold} />
            {children}
          </View>
        ) : null}
      </GlassPanel>
    </View>
  );
}

const hintStyles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  shell: { borderRadius: premium.radiusCard, ...adminShadow.soft },
  card: { borderRadius: premium.radiusCard },
  inner: { padding: spacing.md, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: adminSurfaces.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { ...adminType.formTitle, fontSize: 13.5, color: colors.ink },
  body: { ...adminType.formSub, marginTop: 4, lineHeight: 18, color: colors.muted },
});

const collapseStyles = StyleSheet.create({
  shell: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    ...adminShadow.card,
  },
  wrap: {
    borderRadius: premium.radiusCard,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  headText: { flex: 1 },
  title: { ...adminType.formTitle, color: colors.ink },
  sub: { ...adminType.formSub, color: colors.muted },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3FAEF',
    borderWidth: 1,
    borderColor: adminSurfaces.chipBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  gold: { marginBottom: spacing.sm, marginTop: -spacing.sm },
});
