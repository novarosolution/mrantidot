import { Children, isValidElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronRight, ChevronUp, Ellipsis, Plus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { colors, radii, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const ICON = 42;
const PAD = 14;
/** Hairlines start past the icon tile by default (rows with an icon column). */
const ICON_INSET = PAD + ICON + 12;
/** Rows inside a card give a gentler press than standalone cards. */
const ROW_SCALE = 0.985;

/** Dashed "+ Add …" card that sits above a saved-items list (Urban-style). */
export function ListAddRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.addRow} onPress={onPress} haptic="tap" accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.addIcon}>
        <Plus size={18} color={ui.brand} strokeWidth={2.4} />
      </View>
      <Text style={styles.addText}>{label}</Text>
    </PressableScale>
  );
}

/** Small uppercase label above a group. `first` drops the top gap when it opens a page. */
export function ListSectionTitle({ title, first = false }: { title: string; first?: boolean }) {
  return (
    <Text style={[styles.sectionTitle, first && styles.sectionTitleFirst]} accessibilityRole="header">
      {title}
    </Text>
  );
}

/**
 * One white card (radius 20) holding rows, with hairlines inset past the icon column.
 * Pass `dividerInset` for rows without an icon (e.g. FAQ questions).
 */
export function ListGroup({ children, dividerInset = ICON_INSET }: { children: ReactNode; dividerInset?: number }) {
  const rows = Children.toArray(children).filter(Boolean);
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
  value,
  onPress,
  destructive = false,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Short value shown before the chevron ("2 saved", "English"). */
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <PressableScale
      style={styles.navRow}
      scaleTo={ROW_SCALE}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join('. ')}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
        <Icon size={19} color={destructive ? colors.error : ui.brand} strokeWidth={2.1} />
      </View>
      <View style={styles.navBody}>
        <Text style={[styles.navTitle, destructive && styles.danger]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.navSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={styles.navValue}>{value}</Text> : null}
      {destructive ? null : <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />}
    </PressableScale>
  );
}

/**
 * Checkout-style action row: line icon, title + detail, and an action word ("Change", "Add") or a
 * chevron. `missing` tints it so an unfilled step stands out.
 */
export function ListActionRow({
  icon: Icon,
  title,
  sub,
  action,
  onPress,
  missing = false,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: string;
  onPress: () => void;
  missing?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={ROW_SCALE}
      haptic="select"
      style={styles.actionRow}
      accessibilityRole="button"
      accessibilityLabel={[title, sub, action].filter(Boolean).join('. ')}
    >
      <Icon size={20} color={missing ? ui.brand : ui.text} strokeWidth={2} />
      <View style={styles.navBody}>
        <Text style={[styles.actionTitle, missing && styles.actionTitleMissing]} numberOfLines={2}>
          {title}
        </Text>
        {sub ? (
          <Text style={styles.navSub} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {action ? <Text style={styles.actionText}>{action}</Text> : <ChevronRight size={18} color={ui.textTertiary} />}
    </PressableScale>
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
    <PressableScale
      style={styles.faqRow}
      scaleTo={ROW_SCALE}
      haptic="select"
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={question}
    >
      <View style={styles.faqHead}>
        <Text style={[styles.faqQ, open && styles.faqQOpen]}>{question}</Text>
        <Chevron size={18} color={open ? ui.brand : ui.textTertiary} strokeWidth={2.2} />
      </View>
      {open ? (
        <FadeSlideIn slideFrom={6}>
          <Text style={styles.faqA}>{answer}</Text>
        </FadeSlideIn>
      ) : null}
    </PressableScale>
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
  onPress,
}: {
  icon: LucideIcon;
  highlighted?: boolean;
  title: string;
  badge?: string;
  lines: (string | undefined | null)[];
  onMore?: () => void;
  moreLabel?: string;
  /** Tap the row itself (e.g. edit). */
  onPress?: () => void;
}) {
  const copy = useCustomerUiCopy();
  const shown = lines.filter((l): l is string => Boolean(l && l.trim()));
  const body = (
    <>
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
    </>
  );
  return (
    <View style={styles.row}>
      {onPress ? (
        <PressableScale
          onPress={onPress}
          scaleTo={ROW_SCALE}
          containerStyle={styles.rowMain}
          style={styles.rowMainInner}
          accessibilityRole="button"
          accessibilityLabel={[title, badge, ...shown].filter(Boolean).join('. ')}
        >
          {body}
        </PressableScale>
      ) : (
        <View style={[styles.rowMain, styles.rowMainInner]}>{body}</View>
      )}
      {onMore ? (
        <PressableScale
          style={styles.more}
          onPress={onMore}
          haptic="tap"
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={moreLabel ?? fillCopy(copy.listMoreOptions, { name: title })}
        >
          <Ellipsis size={18} color={ui.textSecondary} strokeWidth={2.2} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/** Muted helper line under a group. */
export function ListFootnote({ children }: { children: ReactNode }) {
  return <Text style={styles.footnote}>{children}</Text>;
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: PAD,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  addIcon: {
    width: ICON,
    height: ICON,
    borderRadius: radii.thumb,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...typeScale.rowTitle, fontFamily: typeScale.button.fontFamily, color: ui.brand },
  sectionTitle: {
    ...typeScale.label,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
    color: ui.textTertiary,
  },
  sectionTitleFirst: { marginTop: 4 },
  group: {
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
    ...ui.shadow,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, paddingRight: 8 },
  rowMain: { flex: 1, minWidth: 0 },
  rowMainInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: PAD, paddingRight: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: PAD, minHeight: 64, backgroundColor: colors.white },
  navBody: { flex: 1, minWidth: 0 },
  navTitle: { ...typeScale.rowTitle, color: ui.text },
  navSub: { ...typeScale.caption, marginTop: 2, color: ui.textSecondary },
  navValue: { ...typeScale.caption, color: ui.textSecondary },
  danger: { color: colors.error },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: PAD + 2,
    paddingVertical: 16,
    minHeight: 60,
    backgroundColor: colors.white,
  },
  actionTitle: { ...typeScale.rowTitle, color: ui.text },
  actionTitleMissing: { color: ui.brand },
  actionText: { ...typeScale.bodyStrong, fontFamily: typeScale.button.fontFamily, color: ui.brand },
  faqRow: { paddingHorizontal: PAD, paddingVertical: 16, backgroundColor: colors.white },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQ: { ...typeScale.rowTitle, flex: 1, color: ui.text },
  faqQOpen: { fontFamily: typeScale.rowTitleLg.fontFamily },
  faqA: { ...typeScale.body, marginTop: 8, paddingRight: 30, lineHeight: 21, color: ui.textSecondary },
  rowIcon: {
    width: ICON,
    height: ICON,
    borderRadius: radii.thumb,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconOn: { backgroundColor: ui.brand },
  rowIconDanger: { backgroundColor: colors.errorBg },
  rowBody: { flex: 1, minWidth: 0, paddingTop: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...typeScale.rowTitle, flexShrink: 1, color: ui.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: ui.brandSoft },
  badgeText: { ...typeScale.micro, fontFamily: typeScale.button.fontFamily, color: ui.brand },
  line: { ...typeScale.caption, marginTop: 3, color: ui.text },
  subLine: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: ui.textSecondary },
  more: { width: 44, height: 44, marginTop: 6, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  footnote: { ...typeScale.caption, fontSize: 12.5, marginTop: 10, marginHorizontal: 4, color: ui.textTertiary },
});
