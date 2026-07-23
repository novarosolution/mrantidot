import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { Button } from './Button';
import { colors, customerType, spacing } from '@/constants/theme';

export function ListEmptyRetry({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const isOffline = message?.toLowerCase().includes('cannot reach') ?? false;
  const heading = title ?? (isOffline ? 'Server unreachable' : 'Something went wrong');

  return (
    <View style={styles.wrap}>
      <GlassPanel style={styles.card} tone="clear" intensity={44}>
        <View style={styles.inner}>
          <PremiumIcon
            icon={isOffline ? AppIcons.toast.offline : AppIcons.ui.alert}
            variant="soft"
            size={28}
            color={colors.error}
            strokeWidth={1.9}
            boxSize={64}
            bg={colors.errorBg}
            bgTo="#FFF5F2"
          />
          <Text style={styles.title}>{heading}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {onRetry ? (
            <Button title="Try again" variant="premium" size="md" onPress={onRetry} style={styles.btn} />
          ) : null}
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { maxWidth: 320, width: '100%', borderRadius: 24 },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
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
