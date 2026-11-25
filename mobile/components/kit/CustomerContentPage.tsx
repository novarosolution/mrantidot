import { Children, isValidElement, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { colors, radii, spacing, ui } from '@/constants/theme';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { stagger } from '@/lib/motion';

/**
 * Shared shell for help / FAQ / legal-style customer pages: header, then a padded column of content.
 * The header already names the page, so a section title is optional — only add one when it says something new.
 */
export function CustomerContentPage({
  title,
  subtitle,
  sectionTitle,
  sectionSubtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader title={title} subtitle={subtitle} variant="premium" showBack />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {sectionTitle ? (
            <PremiumSectionHeader
              title={sectionTitle}
              subtitle={sectionSubtitle}
              style={styles.section}
              compact
            />
          ) : null}
          {/* Each block of the page enters on its own beat (titles, groups, cards) instead of one slab. */}
          <View style={[styles.body, !sectionTitle && styles.bodyTop]}>
            {Children.toArray(children)
              .filter(Boolean)
              .map((child, i) => (
                <FadeSlideIn key={isValidElement(child) && child.key != null ? child.key : i} delay={stagger(i)} slideFrom={14}>
                  {child}
                </FadeSlideIn>
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** White "paper" card for long-form copy (about / terms / privacy) — the same surface as a ListGroup. */
export function ContentCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  section: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  body: { paddingHorizontal: spacing.md },
  bodyTop: { paddingTop: spacing.md },
  // SimpleMarkdown leaves a trailing paragraph margin, so the bottom padding is a little tighter.
  card: {
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
});
