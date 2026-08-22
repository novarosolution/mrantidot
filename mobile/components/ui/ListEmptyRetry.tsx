import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { Button } from './Button';
import { colors, customerType, fonts, premium, spacing } from '@/constants/theme';

/** Premium empty / error / reload card used across list screens. */
export function ListEmptyRetry({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const isOffline = message?.toLowerCase().includes('cannot reach') ?? false;
  const heading = title ?? (isOffline ? 'Server unreachable' : 'Something went wrong');

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <GlassPanel style={styles.card} tone="light" intensity={48} goldEdge padded={false}>
          <View style={styles.inner}>
            <LinearGradient
              colors={isOffline ? ['#FEE2E2', '#FBE7E1'] : [colors.mint, colors.soft]}
              style={styles.iconHalo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <PremiumIcon
                icon={isOffline ? AppIcons.toast.offline : AppIcons.ui.refresh}
                variant="plain"
                size={28}
                color={isOffline ? colors.error : colors.forest}
                strokeWidth={2}
              />
            </LinearGradient>
            <Text style={styles.title}>{heading}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {onRetry ? (
              <Button
                title={retryLabel}
                variant="premium"
                size="md"
                onPress={onRetry}
                style={styles.btn}
                accessibilityLabel={retryLabel}
              />
            ) : null}
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  shell: {
    maxWidth: 340,
    width: '100%',
    borderRadius: premium.radiusCard,
    ...premium.shadowSoft,
  },
  card: { borderRadius: premium.radiusCard },
  inner: {
    padding: spacing.lg + 4,
    alignItems: 'center',
    gap: 10,
  },
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(10,100,35,0.08)',
  },
  title: {
    ...customerType.emptyTitle,
    textAlign: 'center',
    fontFamily: fonts.displaySemi,
  },
  message: {
    ...customerType.emptyBody,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: { marginTop: spacing.sm, minWidth: 168 },
});
