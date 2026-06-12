import { type ComponentType } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function KpiCard({
  icon: Icon,
  value,
  label,
  delta,
  iconBg,
  iconColor,
  onPress,
}: {
  icon: ComponentType<{ color?: string; size?: number }>;
  value: string;
  label: string;
  delta?: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: iconBg }]}>
          <Icon size={18} color={iconColor} />
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {isMeaningfulDelta(delta) ? (
          <Text style={[styles.delta, delta?.startsWith('-') && styles.deltaDown]}>{formatDelta(delta!)}</Text>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  goldBar: { height: 3, width: '100%' },
  content: { padding: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  delta: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green, marginTop: 4 },
  deltaDown: { color: colors.error },
});
