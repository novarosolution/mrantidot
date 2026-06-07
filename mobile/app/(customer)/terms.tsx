import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Card } from '@/components/ui/Card';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { design, spacing } from '@/constants/theme';

export default function TermsScreen() {
  const { content } = useAppContent();
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader title="Terms of Service" variant="premium" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {content.legal.termsMarkdown ? (
          <Card variant="classic" style={styles.card}>
            <SimpleMarkdown text={content.legal.termsMarkdown} />
          </Card>
        ) : (
          <EmptyState title="Terms unavailable" message="Please contact support." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.md },
});
