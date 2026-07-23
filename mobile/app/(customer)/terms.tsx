import { StyleSheet } from 'react-native';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { Card } from '@/components/ui/Card';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { spacing } from '@/constants/theme';

export default function TermsScreen() {
  const { content } = useAppContent();
  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  return (
    <CustomerContentPage
      title="Terms of Service"
      subtitle="Please read carefully"
      sectionTitle="Agreement"
      sectionSubtitle={`Rules for using ${brandName} services`}
    >
      {content.legal.termsMarkdown ? (
        <Card variant="glass" style={styles.card}>
          <SimpleMarkdown text={content.legal.termsMarkdown} />
        </Card>
      ) : (
        <EmptyState title="Terms unavailable" message="Please contact support." />
      )}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, padding: spacing.md },
});
