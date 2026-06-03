import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, spacing } from '@/constants/theme';

export default function FaqScreen() {
  const { content } = useAppContent();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader title="FAQ" subtitle="Frequently asked questions" variant="premium" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {content.faq.length === 0 ? (
          <EmptyState title="No FAQs yet" message="Check back soon." />
        ) : (
          content.faq.map((item, i) => {
            const expanded = open === i;
            return (
              <Card key={i} variant="premium" style={styles.card}>
                <Pressable style={styles.head} onPress={() => setOpen(expanded ? null : i)}>
                  <Text style={styles.q}>{item.q}</Text>
                  {expanded ? (
                    <ChevronUp size={18} color={colors.green} />
                  ) : (
                    <ChevronDown size={18} color={colors.muted} />
                  )}
                </Pressable>
                {expanded ? <Text style={styles.a}>{item.a}</Text> : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.md, marginBottom: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  q: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  a: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: spacing.sm },
});
