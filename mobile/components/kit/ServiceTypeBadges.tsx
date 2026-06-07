import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { colors, fonts, spacing } from '@/constants/theme';

const TYPE_TONES: Record<ServiceTypeKey, BadgeTone> = {
  ant: 'gold',
  cockroach: 'neutral',
  rodent: 'info',
  mosquito: 'sky',
  termite: 'success',
  bed_bug: 'neutral',
  bird: 'info',
  flea: 'gold',
  spider: 'neutral',
  lizard: 'success',
  bee: 'warning',
  wood_borer: 'gold',
  general: 'neutral',
  fumigation: 'neutral',
  deep_cleaning: 'sky',
  silo: 'warning',
};

export function ServiceTypeBadges({
  types,
  max = 4,
}: {
  types?: ServiceTypeKey[];
  max?: number;
}) {
  if (!types?.length) return null;
  const visible = types.slice(0, max);
  const extra = types.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((t) => (
        <StatusBadge key={t} label={SERVICE_TYPE_LABELS[t]} tone={TYPE_TONES[t]} />
      ))}
      {extra > 0 ? <Text style={styles.more}>+{extra}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  more: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted },
});
