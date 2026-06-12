import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export type ProfileStatItem = {
  value: string;
  label: string;
  accent: string;
  softBg: string;
  onPress?: () => void;
};

/** Unified premium stats row — single elevated surface with four tappable cells. */
export function ProfileStatsStrip({ items }: { items: ProfileStatItem[] }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFFFFF', '#F6FAF7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={['#D4A017', '#B6841C']}
        style={styles.goldBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={styles.row}>
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.cell,
              index < items.length - 1 && styles.cellBorder,
              pressed && styles.pressed,
            ]}
            onPress={item.onPress}
            disabled={!item.onPress}
          >
            <View style={[styles.valueRing, { backgroundColor: item.softBg }]}>
              <Text style={[styles.value, { color: item.accent }]}>{item.value}</Text>
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** @deprecated Use ProfileStatsStrip for profile screen layout. */
export function ProfileStatTile({
  value,
  label,
  onPress,
  accent = colors.forest,
}: {
  value: string;
  label: string;
  onPress?: () => void;
  accent?: string;
}) {
  return (
    <ProfileStatsStrip
      items={[{ value, label, accent, softBg: `${accent}14`, onPress }]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  goldBar: {
    height: 3,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(20,83,45,0.1)',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  valueRing: {
    minWidth: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
