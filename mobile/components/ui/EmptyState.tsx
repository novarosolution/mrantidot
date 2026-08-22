import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { Button } from './Button';
import { colors, customerType, fonts, premium, spacing } from '@/constants/theme';

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
      <View style={styles.shell}>
        <GlassPanel style={styles.card} goldEdge tone="mint" intensity={48} padded={false}>
          <View style={styles.inner}>
            <PremiumIcon icon={AppIcons.empty} variant="ring" size="hero" color={colors.forest} boxSize={68} />
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {actionLabel && onAction ? (
              <Button title={actionLabel} variant="premium" size="md" onPress={onAction} style={styles.btn} />
            ) : null}
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  shell: {
    maxWidth: 320,
    width: '100%',
    borderRadius: premium.radiusCard,
    ...premium.shadowSoft,
  },
  card: { borderRadius: premium.radiusCard },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    ...customerType.emptyTitle,
    fontFamily: fonts.displaySemi,
    textAlign: 'center',
  },
  message: {
    ...customerType.emptyBody,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: { marginTop: spacing.sm, minWidth: 160 },
});
