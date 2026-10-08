import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { fonts, spacing, ui } from '@/constants/theme';

export default function FaqScreen() {
  const { content } = useAppContent();
  const [open, setOpen] = useState<number | null>(0);
  const brandName = content.branding.name?.trim() || 'Mr Antidot';

  return (
    <CustomerContentPage
      title="FAQ"
      subtitle="Quick answers"
      sectionTitle="Common questions"
      sectionSubtitle={`${brandName} · tap a question to expand`}
    >
      {content.faq.length === 0 ? (
        <EmptyState title="No FAQs yet" message="Check back soon." />
      ) : (
        content.faq.map((item, i) => {
          const expanded = open === i;
          return (
            <Card key={i} variant="premium" style={styles.card}>
              <Pressable style={styles.head} onPress={() => setOpen(expanded ? null : i)}>
                <Text style={styles.q}>{item.q}</Text>
                <PremiumIcon
                  icon={expanded ? AppIcons.ui.chevronUp : AppIcons.ui.chevronDown}
                  variant="plain"
                  size={18}
                  color={expanded ? ui.brand : ui.textTertiary}
                />
              </Pressable>
              {expanded ? <Text style={styles.a}>{item.a}</Text> : null}
            </Card>
          );
        })
      )}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  q: {
    flex: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    letterSpacing: -0.2,
    color: ui.text,
  },
  a: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: ui.textSecondary,
    marginTop: spacing.sm,
  },
});
