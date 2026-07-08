import { type LucideIcon, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminGoldBar } from '@/components/kit/AdminScreenKit';
import { customerScrollProps } from '@/components/kit/GlassScreenKit';
import { ADMIN_QUICK_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { adminSurfaces, adminType, colors, premium, shadows, spacing } from '@/constants/theme';

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
          style={({ pressed }) => [styles.quickTile, { width: tileWidth }, pressed && styles.pressed]}
          onPress={() => onPress(key)}
        >
          <AdminGoldBar height={2} style={styles.quickGold} />
          <View style={styles.quickIcon}>
            <Icon size={20} color={colors.forest} strokeWidth={2.2} />
          </View>
          <Text style={styles.quickLabel} numberOfLines={1}>
            {label}
          </Text>
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
    <ScrollView horizontal contentContainerStyle={styles.chipsRow} {...customerScrollProps}>
      {chips.map((c) => {
        const active = selected === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Unified stats row for admin list screens. */
export function AdminStatStrip({
  items,
}: {
  items: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <View style={styles.stripWrap}>
      <AdminGoldBar />
      <View style={styles.stripRow}>
        {items.map((item, index) => (
          <View key={item.label} style={[styles.stripCell, index < items.length - 1 && styles.stripBorder]}>
            <Text style={[styles.stripValue, { color: item.color ?? colors.forest }]}>{item.value}</Text>
            <Text style={styles.stripLabel}>{item.label}</Text>
          </View>
        ))}
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
  quickTile: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingTop: spacing.sm + 6,
    borderRadius: 16,
    backgroundColor: adminSurfaces.panelTint,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  quickGold: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { ...adminType.quickLabel },
  chipsRow: {
    paddingHorizontal: spacing.md,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: adminSurfaces.chipBg,
    borderWidth: 1,
    borderColor: adminSurfaces.chipBorder,
  },
  chipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipText: { ...adminType.chipText },
  chipTextActive: { color: colors.white },
  stripWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    backgroundColor: adminSurfaces.panelTint,
    ...shadows.card,
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
    borderRightColor: 'rgba(20,83,45,0.1)',
  },
  stripValue: { ...adminType.statValue },
  stripLabel: { ...adminType.statLabel, marginTop: 2 },
});

/** White form surface with gold top accent — used on content & edit screens. */
export function AdminFormCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View style={[formStyles.card, style]}>
      <AdminGoldBar style={formStyles.goldBar} />
      {children}
    </View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: adminSurfaces.panelTint,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: { marginBottom: spacing.sm, marginTop: -spacing.md, marginHorizontal: -spacing.md },
});

/** Hint banner shown under content tabs. */
export function AdminTabHint({ title, body }: { title: string; body: string }) {
  return (
    <View style={hintStyles.wrap}>
      <LinearGradient colors={['#F6FAF7', '#FFFFFF']} style={hintStyles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <AdminGoldBar style={hintStyles.gold} />
        <Text style={hintStyles.title}>{title}</Text>
        <Text style={hintStyles.body}>{body}</Text>
      </LinearGradient>
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
    <View style={collapseStyles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [collapseStyles.head, pressed && collapseStyles.pressed]}
      >
        <View style={collapseStyles.headText}>
          <Text style={collapseStyles.title}>{title}</Text>
          {subtitle ? <Text style={collapseStyles.sub}>{subtitle}</Text> : null}
        </View>
        <ChevronDown
          size={18}
          color={colors.forest}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? (
        <View style={collapseStyles.body}>
          <AdminGoldBar height={2} style={collapseStyles.gold} />
          {children}
        </View>
      ) : null}
    </View>
  );
}

const hintStyles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    overflow: 'hidden',
  },
  gold: { marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  title: { ...adminType.formTitle, fontSize: 13, color: colors.forest },
  body: { ...adminType.formSub, marginTop: 4, lineHeight: 17 },
});

const collapseStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: adminSurfaces.panelTint,
    borderWidth: 1,
    borderColor: adminSurfaces.cardBorder,
    overflow: 'hidden',
    ...shadows.card,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  headText: { flex: 1 },
  title: { ...adminType.formTitle },
  sub: { ...adminType.formSub },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  gold: { marginBottom: spacing.sm, marginTop: -spacing.sm },
});
