import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, ListChecks, ShieldCheck, Star } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function BookServiceSpecs({
  service,
  durationLabel,
}: {
  service: Service;
  durationLabel: string;
}) {
  const steps = service.stepTemplate ?? [];
  const rating = serviceDisplayRating(service);

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#FFFFFF', '#F7FAF6']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

        <Text style={styles.heading}>Service specs</Text>
        {service.shortDesc ? (
          <Text style={styles.desc} numberOfLines={2}>
            {service.shortDesc}
          </Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <View style={styles.chip}>
            <Clock size={13} color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.chipText}>{durationLabel}</Text>
          </View>
          {rating > 0 ? (
            <View style={styles.chip}>
              <Star size={13} color={colors.amberInk} fill={colors.amberInk} strokeWidth={2} />
              <Text style={styles.chipText}>{rating.toFixed(1)} rating</Text>
            </View>
          ) : null}
          {steps.length > 0 ? (
            <View style={styles.chip}>
              <ListChecks size={13} color={colors.forest} strokeWidth={2.2} />
              <Text style={styles.chipText}>{steps.length} steps</Text>
            </View>
          ) : null}
          <View style={styles.chip}>
            <ShieldCheck size={13} color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.chipText}>Eco-safe</Text>
          </View>
        </ScrollView>

        {steps.length > 0 ? (
          <View style={styles.steps}>
            {steps.map((step, index) => (
              <View key={`${step}-${index}`} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Check size={12} color={colors.forest} strokeWidth={3} />
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.md, marginBottom: spacing.sm },
  heading: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  chips: { flexDirection: 'row', gap: 8, marginTop: spacing.sm, paddingBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  steps: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(20,83,45,0.1)',
    gap: 8,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
});
