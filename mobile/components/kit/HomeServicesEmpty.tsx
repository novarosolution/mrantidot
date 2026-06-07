import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function HomeServicesEmpty({ filtered }: { filtered?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Sparkles size={28} color={colors.forest} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{filtered ? 'No matching services' : 'Services coming soon'}</Text>
        <Text style={styles.message}>
          {filtered
            ? 'Try another category or clear your search.'
            : 'Browse our full catalogue or check back shortly.'}
        </Text>
        <Button
          title={filtered ? 'Clear filters' : 'Browse services'}
          variant="premium"
          onPress={() => router.push('/(customer)/services')}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  card: {
    backgroundColor: colors.white,
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
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
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
