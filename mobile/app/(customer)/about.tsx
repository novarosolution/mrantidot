import { StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { Card } from '@/components/ui/Card';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { colors, fonts, spacing } from '@/constants/theme';

export default function AboutScreen() {
  const { content } = useAppContent();
  const name = content.branding?.name?.trim() || 'Mr Antidot';
  const tagline = content.branding?.tagline?.trim() || 'Trusted pest control & home services';

  return (
    <CustomerContentPage
      title="About us"
      subtitle={name}
      sectionTitle="Our story"
      sectionSubtitle="Who we are and how we care for your space"
    >
      <Card variant="premium" style={styles.brandCard}>
        <View style={styles.brandRow}>
          <BrandLogo size={64} animate={false} />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>{name}</Text>
            <Text style={styles.brandTag}>{tagline}</Text>
          </View>
        </View>
      </Card>

      {content.aboutMarkdown ? (
        <Card variant="glass" style={styles.card}>
          <SimpleMarkdown text={content.aboutMarkdown} />
        </Card>
      ) : (
        <EmptyState title="Nothing here yet" message="Check back soon." />
      )}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  brandCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.forest },
  brandTag: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 },
  card: { marginHorizontal: spacing.md, padding: spacing.md },
});
