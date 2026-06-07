import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Check, Clock } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

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
    <View style={styles.track}>
      <Pressable
        style={[styles.option, mode === 'standard' && styles.optionOn]}
        onPress={() => onChange('standard')}
      >
        <View style={[styles.iconWrap, mode === 'standard' && styles.iconWrapOn]}>
          <CalendarDays size={20} color={mode === 'standard' ? colors.forest : colors.muted} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.label, mode === 'standard' && styles.labelOn]}>{standardLabel}</Text>
          <Text style={[styles.desc, mode === 'standard' && styles.descOn]}>Pick a 2-hour slot</Text>
        </View>
        {mode === 'standard' ? (
          <View style={styles.check}>
            <Check size={14} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={[styles.option, mode === 'custom' && styles.optionOn]}
        onPress={() => onChange('custom')}
      >
        <View style={[styles.iconWrap, mode === 'custom' && styles.iconWrapOn]}>
          <Clock size={20} color={mode === 'custom' ? colors.forest : colors.muted} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.label, mode === 'custom' && styles.labelOn]}>{customLabel}</Text>
          <Text style={[styles.desc, mode === 'custom' && styles.descOn]}>Choose exact time</Text>
        </View>
        {mode === 'custom' ? (
          <View style={styles.check}>
            <Check size={14} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  optionOn: {
    backgroundColor: colors.soft,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapOn: {
    borderColor: 'rgba(30,142,78,0.25)',
    backgroundColor: colors.white,
  },
  textCol: { flex: 1 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
  },
  labelOn: { color: colors.forest },
  desc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  descOn: { color: colors.forest, opacity: 0.85 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
