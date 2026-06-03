import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, design } from '@/constants/theme';

export function Spinner({ fullScreen }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <SafeAreaView style={styles.full} edges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  return <ActivityIndicator color={colors.primary} />;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: design.screenBg,
  },
});
