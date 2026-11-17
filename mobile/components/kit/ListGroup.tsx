import { Children, isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronRight, ChevronUp, Ellipsis, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';

const ICON = 42;
const PAD = 14;
/** Hairlines start past the icon tile by default (rows with an icon column). */
const ICON_INSET = PAD + ICON + 12;

/** Dashed "+ Add …" card that sits above a saved-items list (Urban-style). */
export function ListAddRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.addRow, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <View style={styles.addIcon}>
        <Plus size={18} color={ui.brand} strokeWidth={2.4} />
      </View>
      <Text style={styles.addText}>{label}</Text>
    </Pressable>
  );
}

/** Small uppercase label above a group. `first` drops the top gap when it opens a page. */
export function ListSectionTitle({ title, first = false }: { title: string; first?: boolean }) {
  return <Text style={[styles.sectionTitle, first && styles.sectionTitleFirst]}>{title}</Text>;
}

/**
 * One white card holding rows, with hairlines inset past the icon column.
 * Pass `dividerInset` for rows without an icon (e.g. FAQ questions).
 */
export function ListGroup({ children, dividerInset = ICON_INSET }: { children: ReactNode; dividerInset?: number }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.group}>
      {rows.map((row, i) => (
        <View key={isValidElement(row) && row.key != null ? row.key : i}>
          {i > 0 ? <View style={[styles.divider, { marginLeft: dividerInset }]} /> : null}
          {row}
        </View>
      ))}
    </View>
  );
}

/** Navigation row: icon tile, title, optional second line, chevron. Lives inside a ListGroup. */
export function ListNavRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <View style={styles.rowIcon}>
        <Icon size={19} color={ui.brand} strokeWidth={2.1} />
      </View>
      <View style={styles.navBody}>
        <Text style={styles.navTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.navSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />
    </Pressable>
  );
}

/** FAQ accordion row — question with a chevron, answer revealed underneath. Use in `<ListGroup dividerInset={PAD}>`. */
export function ListFaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <Pressable
      style={({ pressed }) => [styles.faqRow, pressed && styles.pressed]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={question}
    >
      <View style={styles.faqHead}>
        <Text style={[styles.faqQ, open && styles.faqQOpen]}>{question}</Text>
        <Chevron size={18} color={open ? ui.brand : ui.textTertiary} strokeWidth={2.2} />
      </View>
      {open ? <Text style={styles.faqA}>{answer}</Text> : null}
    </Pressable>
  );
}

/** Saved-item row: icon tile (filled when it's the default), title + badge, detail lines, "⋯" menu. */
export function ListGroupRow({
  icon: Icon,
  highlighted = false,
  title,
  badge,
  lines,
  onMore,
  moreLabel,
}: {
  icon: LucideIcon;
  highlighted?: boolean;
  title: string;
  badge?: string;
  lines: (string | undefined | null)[];
  onMore?: () => void;
  moreLabel?: string;
}) {
  const shown = lines.filter((l): l is string => Boolean(l && l.trim()));
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, highlighted && styles.rowIconOn]}>
        <Icon size={19} color={highlighted ? colors.white : ui.brand} strokeWidth={2.1} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {shown.map((line, i) => (
          <Text key={i} style={i === 0 ? styles.line : styles.subLine} numberOfLines={2}>
            {line}
          </Text>
        ))}
      </View>
      {onMore ? (
        <Pressable
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          onPress={onMore}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={moreLabel ?? `More options for ${title}`}
        >
          <Ellipsis size={18} color={ui.textSecondary} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Muted helper line under a group. */
export function ListFootnote({ children }: { children: ReactNode }) {
  return <Text style={styles.footnote}>{children}</Text>;
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: ui.surfaceMuted },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: PAD,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  addIcon: {
    width: ICON,
    height: ICON,
    borderRadius: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.brand },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  sectionTitleFirst: { marginTop: 4 },
  group: {
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: PAD },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: PAD },
  navBody: { flex: 1, minWidth: 0 },
  navTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: ui.text },
  navSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },
  faqRow: { paddingHorizontal: PAD, paddingVertical: 16 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQ: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15.5, lineHeight: 21, color: ui.text },
  faqQOpen: { fontFamily: fonts.bodyBold },
  faqA: {
    marginTop: 8,
    paddingRight: 30,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: ui.textSecondary,
  },
  rowIcon: {
    width: ICON,
    height: ICON,
    borderRadius: 13,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconOn: { backgroundColor: ui.brand },
  rowBody: { flex: 1, minWidth: 0, paddingTop: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, color: ui.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: ui.brandSoft },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.3, color: ui.brand },
  line: { marginTop: 3, fontFamily: fonts.bodyMedium, fontSize: 13.5, lineHeight: 19, color: ui.text },
  subLine: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  more: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  footnote: {
    marginTop: 10,
    marginHorizontal: 4,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: ui.textTertiary,
  },
});
