import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { design, spacing } from '@/constants/theme';

export default function AboutScreen() {
  const { content } = useAppContent();
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader title="About us" subtitle={content.branding.name} variant="premium" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        {content.aboutMarkdown ? (
          <SimpleMarkdown text={content.aboutMarkdown} />
        ) : (
          <EmptyState title="Nothing here yet" message="Check back soon." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
});
