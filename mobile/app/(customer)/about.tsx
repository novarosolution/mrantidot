import { StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { fonts, ui } from '@/constants/theme';

export default function AboutScreen() {
  const { content } = useAppContent();
  const name = content.branding?.name?.trim() || 'Mr Antidot';
  const tagline = content.branding?.tagline?.trim() || 'Trusted pest control & home services';

  return (
    <CustomerContentPage title="About us" subtitle="Who we are">
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

      {content.aboutMarkdown ? null : <EmptyState title="Nothing here yet" message="Check back soon." />}
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  brandText: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: fonts.displaySemi, fontSize: 21, letterSpacing: -0.4, color: ui.text },
  brandTag: { marginTop: 3, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: ui.border, marginVertical: 16 },
});
