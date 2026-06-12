import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function HomeServicesEmpty({ filtered }: { filtered?: boolean }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFFFFF', '#F7FAF6']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.icon}>
          {filtered ? (
            <SearchX size={26} color={colors.forest} strokeWidth={1.8} />
          ) : (
            <AppIcons.brand size={26} color={colors.forest} strokeWidth={1.8} />
          )}
        </View>
        <Text style={styles.title}>{filtered ? 'No matches' : 'Coming soon'}</Text>
        <Text style={styles.message}>
          {filtered ? 'Try another filter or search.' : 'Check back shortly.'}
        </Text>
        <Button
          title="Browse all"
          variant="premium"
          onPress={() => router.push('/(customer)/services')}
          style={styles.btn}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  btn: { marginTop: spacing.md, alignSelf: 'stretch' },
});
