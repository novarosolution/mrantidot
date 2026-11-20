import type { LucideIcon } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import { AdminGoldBar } from '@/components/kit/AdminScreenKit';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { ADMIN_QUICK_COLS, adminGridCellWidth } from '@/lib/adminGrid';
import { haptic } from '@/lib/motion';
import { adminSurfaces, adminType, colors, fonts, premium, spacing, ui } from '@/constants/theme';

export function AdminQuickGrid({
  items,
  onPress,
}: {
  items: { key: string; icon: LucideIcon; label: string; image?: ImageSourcePropType }[];
  onPress: (key: string) => void;
}) {
  const cols = items.length === 4 ? 4 : ADMIN_QUICK_COLS;
  const tileWidth = adminGridCellWidth(cols);

  return (
    <View style={styles.quickGrid}>
      {items.map(({ key, icon: Icon, label }) => (
        <PressableScale
          key={key}
          containerStyle={{ width: tileWidth }}
          style={styles.quickTile}
          onPress={() => onPress(key)}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={styles.quickIcon}>
            <Icon size={21} color={colors.forest} strokeWidth={2} />
          </View>
          <Text style={styles.quickLabel} numberOfLines={1}>
            {label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

export function AdminFilterChips({
  chips,
  selected,
  onSelect,
  inset,
}: {
  chips: { key: string; label: string; disabled?: boolean }[];
  selected: string;
  onSelect: (key: string) => void;
  /** Pad the first chip when the row spans the full screen width. */
  inset?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsScroll}
      contentContainerStyle={[styles.chipsWrap, inset && { paddingLeft: spacing.md }]}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((c) => {
        const active = selected === c.key;
        const locked = Boolean(c.disabled);
        return (
          <Pressable
            key={c.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: locked }}
            disabled={locked}
            onPress={() => {
              if (locked) return;
              haptic('select');
              onSelect(c.key);
            }}
            style={({ pressed }) => [pressed && !locked && styles.chipPressed, locked && styles.chipLocked]}
          >
            <View style={[styles.chip, active && styles.chipActive, locked && styles.chipDisabled]}>
              <Text
                style={[styles.chipText, active && styles.chipTextActive, locked && styles.chipTextDisabled]}
                numberOfLines={1}
              >
                {c.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function AdminSearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Search size={18} color={focused ? ui.brand : ui.textTertiary} strokeWidth={2.2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ui.textTertiary}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search" style={styles.searchClear}>
          <X size={13} color={colors.white} strokeWidth={3} />
        </Pressable>
      ) : null}
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
                <Text style={[styles.stripValue, item.color ? { color: item.color } : null]} numberOfLines={1}>
                  {item.value}
                </Text>
                <Text style={styles.stripLabel} numberOfLines={1}>
                  {item.label}
                </Text>
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
  quickTile: {
    alignItems: 'center',
    gap: 9,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...adminShadow.tile,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...adminType.quickLabel, fontSize: 12, color: ui.text },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    marginBottom: spacing.sm,
  },
  searchFocused: { borderColor: ui.brand },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: ui.text, paddingVertical: 0 },
  searchClear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ui.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: { flexGrow: 0, marginBottom: spacing.sm, overflow: 'visible' },
  chipsWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: spacing.md,
  },
  chip: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  chipActive: {
    backgroundColor: ui.text,
    borderColor: ui.text,
  },
  chipPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  chipLocked: { opacity: 0.72 },
  chipDisabled: {
    backgroundColor: ui.surfaceMuted,
    borderColor: ui.hairline,
  },
  chipText: { ...adminType.chipText, color: ui.text },
  chipTextActive: { color: colors.white },
  chipTextDisabled: { color: ui.textTertiary },
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
  stripValue: { ...adminType.statValue, color: ui.text },
  stripLabel: { ...adminType.statLabel, marginTop: 2 },
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
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
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
    backgroundColor: colors.white,
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
    backgroundColor: ui.brandSoft,
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
