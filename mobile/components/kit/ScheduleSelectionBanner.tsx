import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

export function ScheduleSelectionBanner({ label }: { label: string }) {
  return (
    <View style={styles.wrap}>
      <CheckCircle2 size={18} color={colors.green} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, flex: 1, lineHeight: 19 },
});
