import { StyleSheet, View } from 'react-native';
import { ProfileReferralCard } from '@/components/kit/ProfileReferralCard';
import { ProfileStatsStrip, type ProfileStatItem } from '@/components/kit/ProfileStatTile';
import { spacing } from '@/constants/theme';

/** Stats strip + referral banner grouped as one premium profile section. */
export function ProfileHighlights({
  stats,
  brandName,
  onShare,
}: {
  stats: ProfileStatItem[];
  brandName: string;
  onShare: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <ProfileStatsStrip items={stats} />
      <ProfileReferralCard brandName={brandName} onShare={onShare} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
  },
});
