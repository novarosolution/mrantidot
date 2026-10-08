import { StyleSheet, View } from 'react-native';
import { HomeTrustStrip } from '@/components/kit/HomeTrustStrip';
import { useAppContent } from '@/context/AppContentContext';
import { spacing } from '@/constants/theme';

/** Profile guarantee — same brand promise card as the home feed. */
export function ProfileTrustBanner({ guaranteeText, badges }: { guaranteeText: string; badges?: string[] }) {
  const { content } = useAppContent();
  return (
    <View style={styles.wrap}>
      <HomeTrustStrip brandName={content.branding.name} guaranteeText={guaranteeText} badges={badges} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
});
