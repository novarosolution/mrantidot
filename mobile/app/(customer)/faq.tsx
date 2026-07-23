import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { colors, customerType, fonts, gradients, spacing } from '@/constants/theme';

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
            <Card key={i} variant={expanded ? 'premium' : 'glass'} style={styles.card}>
              {expanded ? (
                <LinearGradient
                  colors={[...gradients.goldBar]}
                  style={styles.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              ) : null}
              <Pressable style={styles.head} onPress={() => setOpen(expanded ? null : i)}>
                <Text style={styles.q}>{item.q}</Text>
                {expanded ? (
                  <PremiumIcon icon={AppIcons.ui.chevronUp} variant="plain" size={18} color={colors.green} />
                ) : (
                  <PremiumIcon icon={AppIcons.ui.chevronDown} variant="plain" size={18} color={colors.muted} />
                )}
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
    overflow: 'hidden',
  },
  accent: {
    height: 3,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  q: { flex: 1, ...customerType.sectionTitleCompact, fontSize: 15 },
  a: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
