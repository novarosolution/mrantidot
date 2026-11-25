import {
  CalendarCheck,
  CornerDownLeft,
  HardHat,
  History,
  Newspaper,
  RefreshCw,
  Search,
  SearchX,
  Sparkles,
  TicketPercent,
  UserRound,
  X,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react-native';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useWideWebLayout } from '@/lib/webAdmin';
import {
  clearRecentSearches,
  matchQuickActions,
  openSearchHit,
  quickActions,
  rememberSearch,
  searchTokens,
  useAdminSearchResults,
  useRecentSearches,
  type QuickAction,
  type SearchBadgeTone,
  type SearchHit,
  type SearchScreen,
} from './adminSearch';

const IS_WEB = Platform.OS === 'web';

const HIT_ICONS: Record<SearchScreen, LucideIcon> = {
  booking: CalendarCheck,
  customer: UserRound,
  technician: HardHat,
  service: Sparkles,
  offer: TicketPercent,
  blog: Newspaper,
};

const BADGE_TONES: Record<SearchBadgeTone, { bg: string; fg: string }> = {
  green: { bg: ui.brandSoft, fg: colors.forest },
  amber: { bg: colors.amberBg, fg: colors.amberInk },
  red: { bg: colors.errorBg, fg: colors.error },
  grey: { bg: colors.greyBg, fg: ui.textSecondary },
  blue: { bg: colors.blueBg, fg: colors.blue },
};

type Entry =
  | { kind: 'recent'; key: string; q: string }
  | { kind: 'action'; key: string; action: QuickAction }
  | { kind: 'hit'; key: string; hit: SearchHit }
  | { kind: 'more'; key: string; label: string; run: () => void };

type Section = { key: string; title: string; entries: Entry[]; link?: { label: string; onPress: () => void } };

/** Bold the parts of `text` that match a search word (first match per word). */
function Highlight({ text, tokens, style, strongStyle, lines = 1 }: { text: string; tokens: string[]; style: object; strongStyle: object; lines?: number }) {
  const parts = useMemo(() => {
    if (!tokens.length || !text) return [{ text, strong: false }];
    const lower = text.toLowerCase();
    const ranges: [number, number][] = [];
    for (const token of tokens) {
      const at = lower.indexOf(token);
      if (at >= 0) ranges.push([at, at + token.length]);
    }
    if (!ranges.length) return [{ text, strong: false }];
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    }
    const out: { text: string; strong: boolean }[] = [];
    let i = 0;
    for (const [a, b] of merged) {
      if (a > i) out.push({ text: text.slice(i, a), strong: false });
      out.push({ text: text.slice(a, b), strong: true });
      i = b;
    }
    if (i < text.length) out.push({ text: text.slice(i), strong: false });
    return out;
  }, [text, tokens]);
  return (
    <Text style={style} numberOfLines={lines}>
      {parts.map((p, i) =>
        p.strong ? (
          <Text key={i} style={strongStyle}>
            {p.text}
          </Text>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </Text>
  );
}

function Kbd({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <View style={[styles.kbd, dark && styles.kbdDark]}>
      <Text style={[styles.kbdText, dark && styles.kbdTextDark]}>{children}</Text>
    </View>
  );
}

function Row({
  entry,
  active,
  keys,
  tokens,
  onPress,
  onHover,
  rowRef,
}: {
  entry: Entry;
  active: boolean;
  /** Keyboard hints (shortcut chips, ↵ on the highlighted row) — desktop only. */
  keys: boolean;
  tokens: string[];
  onPress: () => void;
  onHover: () => void;
  rowRef: (node: View | null) => void;
}) {
  let icon: LucideIcon = Search;
  let title = '';
  let subtitle: string | undefined;
  let meta: string | undefined;
  let badge: SearchHit['badge'];
  let shortcut: string | undefined;
  let highlight = false;
  if (entry.kind === 'recent') {
    icon = History;
    title = entry.q;
  } else if (entry.kind === 'action') {
    icon = entry.action.icon;
    title = entry.action.label;
    subtitle = entry.action.hint;
    shortcut = keys ? entry.action.shortcut : undefined;
  } else if (entry.kind === 'hit') {
    icon = HIT_ICONS[entry.hit.type] ?? Search;
    title = entry.hit.title;
    subtitle = entry.hit.subtitle;
    meta = entry.hit.meta;
    badge = entry.hit.badge;
    highlight = true;
  } else {
    icon = ArrowRight;
    title = entry.label;
  }
  const Icon = icon;
  const tone = badge ? BADGE_TONES[badge.tone] ?? BADGE_TONES.grey : null;
  return (
    <Pressable
      ref={rowRef}
      onPress={onPress}
      onHoverIn={onHover}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, badge?.label, meta].filter(Boolean).join(', ')}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, entry.kind === 'recent' && styles.rowIconQuiet, active && styles.rowIconActive]}>
        <Icon size={16} color={entry.kind === 'recent' ? ui.textSecondary : colors.forest} strokeWidth={2.1} />
      </View>
      <View style={styles.rowText}>
        {highlight ? (
          <Highlight text={title} tokens={tokens} style={styles.rowTitle} strongStyle={styles.rowTitleStrong} />
        ) : (
          <Text style={[styles.rowTitle, entry.kind === 'more' && styles.rowMore]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle ? (
          highlight ? (
            <Highlight text={subtitle} tokens={tokens} style={styles.rowSub} strongStyle={styles.rowSubStrong} />
          ) : (
            <Text style={styles.rowSub} numberOfLines={1}>
              {subtitle}
            </Text>
          )
        ) : null}
      </View>
      {meta ? (
        <Text style={styles.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
      {badge && tone ? (
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]} numberOfLines={1}>
            {badge.label}
          </Text>
        </View>
      ) : null}
      {shortcut ? (
        <View style={styles.shortcut}>
          {shortcut.split(' ').map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </View>
      ) : null}
      {keys && active ? <CornerDownLeft size={15} color={ui.textTertiary} strokeWidth={2.2} /> : null}
    </Pressable>
  );
}

function SkeletonRows() {
  return (
    <View style={styles.skeletons} accessibilityRole="progressbar" accessibilityLabel="Searching">
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={32} height={32} radius={9} />
          <View style={styles.skeletonText}>
            <Skeleton width={i === 1 ? '46%' : '62%'} height={12} radius={6} />
            <Skeleton width={i === 2 ? '30%' : '40%'} height={10} radius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Global admin search: one box for bookings (ref, customer, phone, service), customers, technicians,
 * services, offer codes and blog posts, plus quick actions and recent searches. Arrow keys move, Enter
 * opens, Escape closes (web). Used by the desktop command palette and the phone Search screen.
 */
export function AdminSearchPanel({
  variant,
  onClose,
  openShortcuts,
  autoFocus = true,
}: {
  variant: 'palette' | 'screen';
  /** Escape (web) — and, in the palette, right before a result or action opens. */
  onClose?: () => void;
  /** Web: adds "Keyboard shortcuts" to the actions. */
  openShortcuts?: () => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const wideWeb = useWideWebLayout();
  // Arrow-key highlight and shortcut chips: the palette, or a desktop-width browser.
  const keys = IS_WEB && (variant === 'palette' || wideWeb);
  const debounced = useDebouncedValue(q, 160);
  const results = useAdminSearchResults(debounced);
  const recents = useRecentSearches();
  const actions = useMemo(
    () => quickActions({ openShortcuts }).filter((a) => !a.webOnly || IS_WEB),
    [openShortcuts],
  );
  const tokens = useMemo(() => searchTokens(results.q || q), [results.q, q]);
  const inputRef = useRef<TextInput>(null);
  const rowNodes = useRef(new Map<string, View | null>());
  const [active, setActive] = useState(0);
  // Results for an older query stay until the new ones arrive (no flicker while typing).
  const stale = q.length > 0 && (debounced !== q || results.loading || results.q !== debounced);

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (!q) {
      if (recents.length) {
        out.push({
          key: 'recent',
          title: 'Recent searches',
          entries: recents.map((r) => ({ kind: 'recent', key: `recent:${r}`, q: r })),
          link: { label: 'Clear', onPress: clearRecentSearches },
        });
      }
      out.push({
        key: 'actions',
        title: 'Quick actions',
        entries: actions.filter((a) => a.featured).map((a) => ({ kind: 'action', key: `action:${a.key}`, action: a })),
      });
      out.push({
        key: 'jump',
        title: 'Jump to',
        entries: actions.filter((a) => !a.featured).map((a) => ({ kind: 'action', key: `action:${a.key}`, action: a })),
      });
      return out;
    }
    const matched = matchQuickActions(actions, q, 3);
    if (matched.length) {
      out.push({ key: 'actions', title: 'Actions', entries: matched.map((a) => ({ kind: 'action', key: `action:${a.key}`, action: a })) });
    }
    if (results.q) {
      for (const group of results.groups) {
        const entries: Entry[] = group.items.map((hit) => ({ kind: 'hit', key: `${hit.type}:${hit.id}`, hit }));
        if (group.type === 'bookings' && group.total > group.items.length) {
          const text = results.q;
          entries.push({
            kind: 'more',
            key: 'more:bookings',
            label: `See all ${group.total} bookings for “${text}”`,
            run: () => appPush(adminRoutes.bookingsFiltered({ q: text })),
          });
        }
        out.push({ key: group.type, title: group.total > group.items.length ? `${group.label} · ${group.total}` : group.label, entries });
      }
    }
    return out;
  }, [actions, debounced, q, recents, results.groups, results.q]);

  const entries = useMemo(() => sections.flatMap((s) => s.entries), [sections]);
  const entryKey = entries.map((e) => e.key).join('|');

  // A new list of rows starts at the top.
  useEffect(() => {
    setActive(0);
  }, [entryKey]);

  // Keep the highlighted row in view while moving with the arrow keys.
  useEffect(() => {
    if (!IS_WEB) return;
    const key = entries[active]?.key;
    const node = key ? (rowNodes.current.get(key) as unknown as { scrollIntoView?: (o: object) => void } | null) : null;
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [active, entries]);

  const activate = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      haptic('tap');
      if (entry.kind === 'recent') {
        setQuery(entry.q);
        inputRef.current?.focus();
        return;
      }
      if (q) void rememberSearch(q);
      // The palette gets out of the way; the phone screen stays under the opened screen (Back returns here).
      if (variant === 'palette') onClose?.();
      if (entry.kind === 'action') entry.action.run();
      else if (entry.kind === 'hit') openSearchHit(entry.hit);
      else entry.run();
    },
    [onClose, q, variant],
  );

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = e.nativeEvent.key;
    const prevent = () => (e as unknown as { preventDefault?: () => void }).preventDefault?.();
    if (key === 'ArrowDown') {
      prevent();
      if (entries.length) setActive((i) => (i + 1) % entries.length);
    } else if (key === 'ArrowUp') {
      prevent();
      if (entries.length) setActive((i) => (i - 1 + entries.length) % entries.length);
    } else if (key === 'Enter') {
      prevent();
      activate(entries[active]);
    } else if (key === 'Escape') {
      prevent();
      onClose?.();
    }
  };

  const palette = variant === 'palette';
  let index = -1;

  const noResults = Boolean(q) && !stale && !results.error && results.q === debounced && results.groups.length === 0;

  return (
    <View style={[styles.root, palette ? styles.rootPalette : styles.rootScreen]}>
      <View style={[styles.inputRow, palette ? styles.inputRowPalette : styles.inputRowScreen]}>
        <Search size={palette ? 19 : 18} color={colors.forest} strokeWidth={2.3} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onKeyPress={IS_WEB ? onKeyPress : undefined}
          onSubmitEditing={IS_WEB ? undefined : () => activate(entries[0])}
          placeholder="Search bookings, customers, phone, services, codes…"
          placeholderTextColor={ui.textTertiary}
          style={[styles.input, palette && styles.inputPalette]}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search the admin"
        />
        {q && stale ? <ActivityIndicator size="small" color={colors.forest} /> : null}
        {query ? (
          <Pressable
            onPress={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clear}
          >
            <X size={13} color={colors.white} strokeWidth={3} />
          </Pressable>
        ) : null}
        {palette ? <Kbd>esc</Kbd> : null}
      </View>

      <ScrollView
        style={palette ? styles.listPalette : styles.listScreen}
        contentContainerStyle={styles.listInner}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.link ? (
                <Pressable onPress={section.link.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${section.link.label} ${section.title}`}>
                  <Text style={styles.sectionLink}>{section.link.label}</Text>
                </Pressable>
              ) : null}
            </View>
            {section.entries.map((entry) => {
              index += 1;
              const i = index;
              return (
                <Row
                  key={entry.key}
                  entry={entry}
                  active={keys && i === active}
                  keys={keys}
                  tokens={tokens}
                  onPress={() => activate(entry)}
                  onHover={() => setActive(i)}
                  rowRef={(node) => {
                    rowNodes.current.set(entry.key, node);
                  }}
                />
              );
            })}
          </View>
        ))}

        {q && stale && !results.q ? <SkeletonRows /> : null}

        {results.error && q ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Search didn’t load</Text>
            <Text style={styles.stateText}>{results.error}</Text>
            <Pressable onPress={results.retry} style={({ pressed }) => [styles.retry, pressed && styles.rowPressed]} accessibilityRole="button">
              <RefreshCw size={14} color={colors.forest} strokeWidth={2.4} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {noResults ? (
          <View style={styles.state}>
            <View style={styles.stateIcon}>
              <SearchX size={22} color={ui.brand} strokeWidth={2} />
            </View>
            <Text style={styles.stateTitle}>No matches for “{q}”</Text>
            <Text style={styles.stateText}>
              Try a booking ref like #MA-1A2B3, a phone number, a customer or technician name, a service or an offer code.
            </Text>
          </View>
        ) : null}

        {!q && !palette ? (
          <Text style={styles.tip}>
            Find bookings by ref (#MA-1A2B3), customer name or phone; people by name, phone or email; services, offer codes and blog
            posts.
          </Text>
        ) : null}
      </ScrollView>

      {palette ? (
        <View style={styles.footer}>
          <View style={styles.footerHint}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Text style={styles.footerText}>move</Text>
          </View>
          <View style={styles.footerHint}>
            <Kbd>↵</Kbd>
            <Text style={styles.footerText}>open</Text>
          </View>
          <View style={styles.footerHint}>
            <Kbd>esc</Kbd>
            <Text style={styles.footerText}>close</Text>
          </View>
          <View style={styles.flex} />
          {openShortcuts ? (
            <Pressable
              onPress={() => {
                onClose?.();
                openShortcuts();
              }}
              style={styles.footerHint}
              accessibilityRole="button"
              accessibilityLabel="Keyboard shortcuts"
            >
              <Kbd>?</Kbd>
              <Text style={styles.footerText}>shortcuts</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { backgroundColor: colors.white },
  rootPalette: { borderRadius: 18, overflow: 'hidden' },
  rootScreen: { flex: 1, backgroundColor: 'transparent' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputRowPalette: {
    height: 60,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  inputRowScreen: {
    height: 50,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.forest,
    backgroundColor: colors.white,
    ...ui.shadow,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.bodyMedium,
    fontSize: 15.5,
    color: ui.text,
    ...(IS_WEB ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputPalette: { fontSize: 16.5 },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ui.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPalette: { maxHeight: 460 },
  listScreen: { flex: 1 },
  listInner: { paddingVertical: 6, paddingHorizontal: 8, paddingBottom: spacing.md },
  section: { paddingTop: 6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  sectionLink: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rowActive: { backgroundColor: '#EEF6F0' },
  rowPressed: { opacity: 0.75 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconQuiet: { backgroundColor: ui.surfaceMuted },
  rowIconActive: { backgroundColor: colors.white },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: ui.text },
  rowTitleStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  rowMore: { fontFamily: fonts.bodySemi, color: colors.forest },
  rowSub: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  rowSubStrong: { fontFamily: fonts.bodySemi, color: ui.text },
  rowMeta: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.textSecondary, maxWidth: 120 },
  badge: { paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', maxWidth: 120 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.2 },
  shortcut: { flexDirection: 'row', gap: 4 },
  kbd: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ui.border,
    borderBottomWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbdDark: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  kbdText: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.textSecondary },
  kbdTextDark: { color: colors.white },
  skeletons: { gap: 6, paddingHorizontal: 10, paddingTop: 10 },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 46 },
  skeletonText: { flex: 1, gap: 7 },
  state: { alignItems: 'center', gap: 8, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stateTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text, textAlign: 'center' },
  stateText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: ui.textSecondary, textAlign: 'center', maxWidth: 420 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ui.border,
  },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  tip: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: ui.textTertiary,
    paddingHorizontal: 12,
    paddingTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 42,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    backgroundColor: '#FAFBFA',
  },
  footerHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
});
