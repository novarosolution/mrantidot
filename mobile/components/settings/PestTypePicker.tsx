import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { PestImage } from '@/components/kit/ServiceThumb';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey, type ServiceTypeKey } from '@/constants/serviceTypes';
import { useBusinessSettings } from '@/lib/businessSettings';
import { pestLabel } from '@/lib/settingsLabels';
import { colors, fonts, gradients, premium, spacing } from '@/constants/theme';
import { adminContentWidth } from '@/lib/webAdmin';

const COLS = 3;
const GAP = 10;

function tileWidth(contentInset = 48) {
  const usable = adminContentWidth(Dimensions.get('window').width) - contentInset - GAP * (COLS - 1);
  return Math.floor(usable / COLS);
}

/**
 * Pest / treatment types for a service, from Business settings → Lists → Pest names: names and order
 * are the admin's; switched-off types are hidden unless this service already has them (shown as "Off").
 */
export function PestTypePicker({
  value,
  onChange,
  contentInset = 48,
}: {
  value: ServiceTypeKey[];
  onChange: (next: ServiceTypeKey[]) => void;
  contentInset?: number;
}) {
  const settings = useBusinessSettings();
  const width = tileWidth(contentInset);
  const items = settings.lists.pestTypes.filter((p) => isServiceTypeKey(p.key) && (p.active || value.includes(p.key as ServiceTypeKey)));
  const activeKeys = items.filter((p) => p.active).map((p) => p.key as ServiceTypeKey);
  const allSelected = activeKeys.length > 0 && activeKeys.every((k) => value.includes(k));

  const toggle = (key: ServiceTypeKey) => onChange(value.includes(key) ? value.filter((t) => t !== key) : [...value, key]);

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {value.length}/{activeKeys.length} selected
        </Text>
        <Pressable
          style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}
          onPress={() => onChange(allSelected ? value.filter((k) => !activeKeys.includes(k)) : [...new Set([...value, ...activeKeys])])}
          accessibilityRole="button"
        >
          <Text style={styles.toolBtnText}>{allSelected ? 'Clear all' : 'Select all'}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {items.map((p) => {
          const key = p.key as ServiceTypeKey;
          const meta = SERVICE_TYPE_META[key];
          const on = value.includes(key);
          const label = pestLabel(key, settings);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={p.active ? label : `${label}, switched off in Business settings`}
              style={({ pressed }) => [styles.tile, { width }, on && styles.tileOn, !p.active && styles.tileOff, pressed && styles.pressed]}
              onPress={() => toggle(key)}
            >
              {on ? (
                <LinearGradient colors={[...gradients.header]} style={styles.check}>
                  <Check size={10} color={colors.white} strokeWidth={3} />
                </LinearGradient>
              ) : null}
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <PestImage source={meta.image} size={26} />
              </View>
              <Text style={[styles.label, on && styles.labelOn]} numberOfLines={2}>
                {label}
              </Text>
              {!p.active ? <Text style={styles.offTag}>Off</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, width: '100%' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolBtnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  pressed: { opacity: 0.9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: '100%' },
  tile: {
    minHeight: 96,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  tileOn: { backgroundColor: colors.white, borderColor: colors.forest, borderWidth: 2 },
  tileOff: { opacity: 0.7 },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink, textAlign: 'center', lineHeight: 14 },
  labelOn: { color: colors.forest },
  offTag: { marginTop: 4, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.4, color: colors.amberInk },
});
