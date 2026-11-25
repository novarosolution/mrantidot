import { StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export default function AboutScreen() {
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const name = content.branding?.name?.trim() || 'Mr Antidot';
  const tagline = content.branding?.tagline?.trim() || copy.launchTaglineFallback;

  return (
    <CustomerContentPage title={copy.aboutTitle} subtitle={copy.aboutSubtitle}>
      {/* Brand and story share one card: the logo row is the card's masthead. */}
      <ContentCard>
        <View style={styles.brandRow}>
          <BrandLogo size={60} animate={false} />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>{name}</Text>
            <Text style={styles.brandTag}>{tagline}</Text>
          </View>
        </View>
        {content.aboutMarkdown ? (
          <>
            <View style={styles.rule} />
            <SimpleMarkdown text={content.aboutMarkdown} />
          </>
        ) : null}
      </ContentCard>

      {content.aboutMarkdown ? null : <EmptyState title={copy.aboutEmptyTitle} message={copy.aboutEmptyMessage} />}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { ...typeScale.title, fontSize: 21, lineHeight: 27, color: ui.text },
  brandTag: { ...typeScale.caption, marginTop: 3, lineHeight: 19, color: ui.textSecondary },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border, marginVertical: 16 },
});
