import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

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
          <PremiumIcon
            icon={AppIcons.ui.calendar}
            variant="plain"
            size={20}
            color={mode === 'standard' ? colors.forest : colors.muted}
          />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.label, mode === 'standard' && styles.labelOn]}>{standardLabel}</Text>
          <Text style={[styles.desc, mode === 'standard' && styles.descOn]}>2-hour slots · 24/7</Text>
        </View>
        {mode === 'standard' ? (
          <View style={styles.check}>
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={14} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={[styles.option, mode === 'custom' && styles.optionOn]}
        onPress={() => onChange('custom')}
      >
        <View style={[styles.iconWrap, mode === 'custom' && styles.iconWrapOn]}>
          <PremiumIcon
            icon={AppIcons.ui.clock}
            variant="plain"
            size={20}
            color={mode === 'custom' ? colors.forest : colors.muted}
          />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.label, mode === 'custom' && styles.labelOn]}>{customLabel}</Text>
          <Text style={[styles.desc, mode === 'custom' && styles.descOn]}>Any time · 24/7</Text>
        </View>
        {mode === 'custom' ? (
          <View style={styles.check}>
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={14} color={colors.white} strokeWidth={3} />
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
    borderColor: surfaces.glassBorderStrong,
    backgroundColor: surfaces.glass,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  optionOn: {
    backgroundColor: colors.soft,
  },
  divider: {
    height: 1,
    backgroundColor: surfaces.glassBorder,
    marginHorizontal: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: surfaces.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  iconWrapOn: {
    borderColor: 'rgba(143,208,60,0.45)',
    backgroundColor: colors.soft,
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
