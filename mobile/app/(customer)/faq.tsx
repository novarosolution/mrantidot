import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { ListFaqRow, ListGroup, ListNavRow } from '@/components/kit/ListGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { AppIcons } from '@/constants/appIcons';
import { fillCopy } from '@/constants/customerUiCopy';
import { useAppContent } from '@/context/AppContentContext';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { customerRoutes, appPush } from '@/lib/routes';
import { colors, radii, spacing, typeScale, ui as themeUi } from '@/constants/theme';
import { haptic, motion } from '@/lib/motion';

/** Show the search box once there are enough questions to be worth searching. */
const SEARCH_FROM = 5;

export default function FaqScreen() {
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const [openKey, setOpenKey] = useState<string | null>(content.faq[0]?.q ?? null);
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Keys are the question text (stable across admin re-orders), de-duplicated if two match.
    const seen = new Map<string, number>();
    return content.faq
      .map((item) => {
        const n = seen.get(item.q) ?? 0;
        seen.set(item.q, n + 1);
        return { ...item, key: n ? `${item.q}#${n}` : item.q };
      })
      .filter((item) => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [content.faq, query]);

  function toggle(key: string) {
    // Smoothly open the answer and close the previous one.
    if (!getReducedMotion()) {
      LayoutAnimation.configureNext(LayoutAnimation.create(motion.duration.base, 'easeInEaseOut', 'opacity'));
    }
    haptic('select');
    setOpenKey((cur) => (cur === key ? null : key));
  }

  return (
    <CustomerContentPage title={ui.profileMenuFaq} subtitle={ui.profileMenuFaqSub}>
      {content.faq.length >= SEARCH_FROM ? (
        <View style={styles.search}>
          <Search size={18} color={themeUi.textSecondary} strokeWidth={2} />
          <TextInput
            {...textInputDefaults}
            value={query}
            onChangeText={setQuery}
            placeholder={ui.faqSearchPlaceholder}
            placeholderTextColor={themeUi.textTertiary}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel={ui.faqSearchPlaceholder}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={12} accessibilityRole="button" accessibilityLabel={ui.homeSearchClear} style={styles.clear}>
              <X size={13} color={colors.white} strokeWidth={3} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {content.faq.length === 0 ? (
        <EmptyState icon={AppIcons.profile.faq} title={ui.faqEmptyTitle} message={ui.faqEmptyMessage} />
      ) : items.length === 0 ? (
        <Text style={styles.noMatch} accessibilityLiveRegion="polite">
          {fillCopy(ui.faqNoMatches, { query: query.trim() })}
        </Text>
      ) : (
        // Question rows have no icon column, so hairlines run from the card's left padding.
        <ListGroup dividerInset={14}>
          {items.map((item) => (
            <ListFaqRow
              key={item.key}
              question={item.q}
              answer={item.a}
              open={openKey === item.key || (query.trim().length > 0 && items.length === 1)}
              onToggle={() => toggle(item.key)}
            />
          ))}
        </ListGroup>
      )}

      <View style={styles.more}>
        <ListGroup>
          <ListNavRow
            icon={AppIcons.ui.message}
            title={ui.faqStillNeedHelp}
            subtitle={ui.faqStillNeedHelpSub}
            onPress={() => appPush(customerRoutes.help)}
          />
        </ListGroup>
      </View>
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: themeUi.hairline,
  },
  searchInput: { ...typeScale.body, flex: 1, minWidth: 0, paddingVertical: 0, color: themeUi.text },
  clear: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: themeUi.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMatch: { ...typeScale.body, textAlign: 'center', paddingVertical: spacing.lg, color: themeUi.textSecondary },
  more: { marginTop: spacing.md },
});
