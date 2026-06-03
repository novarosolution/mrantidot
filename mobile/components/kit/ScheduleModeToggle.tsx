import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Clock } from 'lucide-react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ScheduleModeToggle({
  mode,
  onChange,
  standardLabel = 'Standard window',
  customLabel = 'Custom time',
}: {
  mode: 'standard' | 'custom';
  onChange: (mode: 'standard' | 'custom') => void;
  standardLabel?: string;
  customLabel?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.segment, mode === 'standard' && styles.segmentOn]}
        onPress={() => onChange('standard')}
      >
        <CalendarDays size={16} color={mode === 'standard' ? colors.secondaryInk : colors.muted} />
        <Text style={[styles.segmentText, mode === 'standard' && styles.segmentTextOn]}>{standardLabel}</Text>
      </Pressable>
      <Pressable
        style={[styles.segment, mode === 'custom' && styles.segmentOn]}
        onPress={() => onChange('custom')}
      >
        <Clock size={16} color={mode === 'custom' ? colors.secondaryInk : colors.muted} />
        <Text style={[styles.segmentText, mode === 'custom' && styles.segmentTextOn]}>{customLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.soft,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  segmentOn: {
    backgroundColor: colors.white,
    ...premium.shadowSoft,
  },
  segmentText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted },
  segmentTextOn: { color: colors.secondaryInk },
});
