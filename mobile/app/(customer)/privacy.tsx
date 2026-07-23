import { StyleSheet } from 'react-native';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { Card } from '@/components/ui/Card';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const { content } = useAppContent();
  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  return (
    <CustomerContentPage
      title="Privacy Policy"
      subtitle="How we protect your data"
      sectionTitle="Your privacy"
      sectionSubtitle={`How ${brandName} collects and uses your data`}
    >
      {content.legal.privacyMarkdown ? (
        <Card variant="glass" style={styles.card}>
          <SimpleMarkdown text={content.legal.privacyMarkdown} />
        </Card>
      ) : (
        <EmptyState title="Privacy policy unavailable" message="Please contact support." />
      )}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, padding: spacing.md },
});
