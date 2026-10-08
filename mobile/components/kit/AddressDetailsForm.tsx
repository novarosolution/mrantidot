import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Home, Building2, MapPinned } from 'lucide-react-native';
import { TEXT_INPUT_FONT_SIZE, textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, ui } from '@/constants/theme';

export type AddressSaveAs = 'Home' | 'Office' | 'Other';

export type AddressFormValues = {
  house: string;
  street: string;
  landmark: string;
  city: string;
  pincode: string;
  saveAs: AddressSaveAs;
};

export const EMPTY_ADDRESS_FORM: AddressFormValues = {
  house: '',
  street: '',
  landmark: '',
  city: '',
  pincode: '',
  saveAs: 'Home',
};

const SAVE_AS: { key: AddressSaveAs; label: string; Icon: typeof Home }[] = [
  { key: 'Home', label: 'Home', Icon: Home },
  { key: 'Office', label: 'Office', Icon: Building2 },
  { key: 'Other', label: 'Other', Icon: MapPinned },
];

/** Compose booking address string from structured fields. */
export function composeAddressLine(v: AddressFormValues): string {
  return [
    v.house.trim() ? `Flat/House ${v.house.trim()}` : '',
    v.street.trim(),
    v.landmark.trim() ? `Landmark: ${v.landmark.trim()}` : '',
    v.city.trim(),
    v.pincode.trim(),
  ]
    .filter(Boolean)
    .join(', ');
}

export function addressFormValid(v: AddressFormValues): boolean {
  return Boolean(v.house.trim() && v.street.trim() && v.city.trim());
}

/** Premium structured address fields — house/flat, landmark, save-as. */
export function AddressDetailsForm({
  value,
  onChange,
  showSaveAs = true,
}: {
  value: AddressFormValues;
  onChange: (next: AddressFormValues) => void;
  showSaveAs?: boolean;
}) {
  function patch(partial: Partial<AddressFormValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <View style={styles.wrap}>
      <Field
        label="House / flat number"
        required
        value={value.house}
        onChangeText={(house) => patch({ house })}
        placeholder="e.g. A-302 / 14"
        autoCapitalize="characters"
      />
      <Field
        label="Street / area"
        required
        value={value.street}
        onChangeText={(street) => patch({ street })}
        placeholder="Street, society, area"
      />
      <Field
        label="Landmark"
        optional
        value={value.landmark}
        onChangeText={(landmark) => patch({ landmark })}
        placeholder="Near park, opposite temple…"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Field
            label="City"
            required
            value={value.city}
            onChangeText={(city) => patch({ city })}
            placeholder="City"
          />
        </View>
        <View style={styles.pin}>
          <Field
            label="Pincode"
            optional
            value={value.pincode}
            onChangeText={(pincode) => patch({ pincode: pincode.replace(/[^\d]/g, '').slice(0, 6) })}
            placeholder="6 digits"
            keyboardType="number-pad"
          />
        </View>
      </View>

      {showSaveAs ? (
        <View style={styles.saveBlock}>
          <Text style={styles.saveLabel}>Save as</Text>
          <View style={styles.saveRow}>
            {SAVE_AS.map(({ key, label, Icon }) => {
              const on = value.saveAs === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => patch({ saveAs: key })}
                  style={({ pressed }) => [styles.saveChip, on && styles.saveChipOn, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Save as ${label}`}
                >
                  <Icon size={15} color={on ? colors.white : ui.brand} strokeWidth={2.2} />
                  <Text style={[styles.saveChipText, on && styles.saveChipTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  optional,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.req}>Required</Text> : null}
        {optional ? <Text style={styles.opt}>Optional</Text> : null}
      </View>
      <TextInput
        {...textInputDefaults}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ui.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1.4, minWidth: 0 },
  pin: { flex: 1, minWidth: 0 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  label: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textSecondary,
  },
  req: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: ui.brand,
    letterSpacing: 0.2,
  },
  opt: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: ui.textTertiary,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.hairline,
    fontFamily: fonts.bodySemi,
    fontSize: TEXT_INPUT_FONT_SIZE,
    color: ui.text,
  },
  saveBlock: { gap: 8, marginTop: 2 },
  saveLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textSecondary,
    paddingHorizontal: 2,
  },
  saveRow: { flexDirection: 'row', gap: 8 },
  saveChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  saveChipOn: {
    backgroundColor: ui.brand,
    borderColor: ui.brand,
  },
  saveChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: ui.brand,
  },
  saveChipTextOn: { color: colors.white },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});
