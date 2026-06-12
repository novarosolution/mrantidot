import { type LucideIcon, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function AdminQuickGrid({
  items,
  onPress,
}: {
  items: { key: string; icon: LucideIcon; label: string }[];
  onPress: (key: string) => void;
}) {
  return (
    <View style={styles.quickGrid}>
      {items.map(({ key, icon: Icon, label }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
          onPress={() => onPress(key)}
        >
          <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.quickGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
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
      <LinearGradient
        colors={['#FFFFFF', '#F6FAF7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
  },
  quickTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingTop: spacing.sm + 6,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  quickGold: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
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
  quickLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  chipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  chipTextActive: { color: colors.white },
  stripWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  goldBar: { height: 3, width: '100%' },
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
  stripValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  stripLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

/** White form surface with gold top accent — used on content & edit screens. */
export function AdminFormCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View style={[formStyles.card, style]}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={formStyles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: { height: 3, width: '100%', marginBottom: spacing.sm, marginTop: -spacing.md, marginHorizontal: -spacing.md },
});

/** Hint banner shown under content tabs. */
export function AdminTabHint({ title, body }: { title: string; body: string }) {
  return (
    <View style={hintStyles.wrap}>
      <LinearGradient colors={['#F6FAF7', '#FFFFFF']} style={hintStyles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={hintStyles.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
          <LinearGradient colors={['#D4A017', '#B6841C']} style={collapseStyles.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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
  gold: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  body: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
});

const collapseStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
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
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  gold: { height: 2, marginBottom: spacing.sm, marginTop: -spacing.sm },
});
