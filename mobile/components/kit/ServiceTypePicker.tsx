import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ServiceTypePicker({
  value,
  onChange,
}: {
  value: ServiceTypeKey[];
  onChange: (next: ServiceTypeKey[]) => void;
}) {
  const allSelected = SERVICE_TYPE_KEYS.every((k) => value.includes(k));

  function toggle(key: ServiceTypeKey) {
    onChange(value.includes(key) ? value.filter((t) => t !== key) : [...value, key]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {value.length}/{SERVICE_TYPE_KEYS.length} selected
        </Text>
        <Pressable
          style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}
          onPress={() => onChange(allSelected ? [] : [...SERVICE_TYPE_KEYS])}
        >
          <Text style={styles.toolBtnText}>{allSelected ? 'Clear all' : 'Select all'}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {SERVICE_TYPE_KEYS.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          const Icon = meta.icon;
          const on = value.includes(key);
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.tile, on && styles.tileOn, pressed && styles.pressed]}
              onPress={() => toggle(key)}
            >
              {on ? (
                <LinearGradient colors={['#14532D', '#1A6B3C']} style={styles.check}>
                  <Check size={10} color={colors.white} strokeWidth={3} />
                </LinearGradient>
              ) : null}
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <Icon size={20} color={meta.color} strokeWidth={2.2} />
              </View>
              <Text style={[styles.label, on && styles.labelOn]} numberOfLines={2}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    minHeight: 96,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  tileOn: {
    backgroundColor: colors.white,
    borderColor: colors.forest,
    borderWidth: 2,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  labelOn: { color: colors.forest },
});
