import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { design, spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const { content } = useAppContent();
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader title="Privacy Policy" subtitle="Legal" variant="premium" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {content.legal.privacyMarkdown ? (
          <SimpleMarkdown text={content.legal.privacyMarkdown} />
        ) : (
          <EmptyState title="Policy unavailable" message="Please contact support." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
});
