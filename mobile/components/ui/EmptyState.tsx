import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { VolumeSphere } from '@/components/kit/PremiumMeshBg';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { Button } from './Button';
import { colors, customerType, spacing } from '@/constants/theme';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <GlassPanel style={styles.card} goldEdge tone="mint" intensity={48}>
        <View style={styles.inner}>
          <View style={styles.orbWrap}>
            <VolumeSphere size={110} tone="lime" opacity={0.7} style={styles.orb} withShadow={false} />
            <PremiumIcon icon={AppIcons.empty} variant="ring" size="hero" color={colors.forest} boxSize={68} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {actionLabel && onAction ? (
            <Button title={actionLabel} variant="premium" size="md" onPress={onAction} style={styles.btn} />
          ) : null}
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { maxWidth: 320, width: '100%', borderRadius: 24 },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  orbWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  orb: { position: 'absolute' },
  title: {
    ...customerType.emptyTitle,
    textAlign: 'center',
  },
  message: {
    ...customerType.emptyBody,
    textAlign: 'center',
  },
  btn: { marginTop: spacing.sm, minWidth: 160 },
});
