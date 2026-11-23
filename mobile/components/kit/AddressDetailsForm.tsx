import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Home, Building2, MapPinned } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { TEXT_INPUT_FONT_SIZE, textInputDefaults } from '@/components/ui/textInputDefaults';
import { DEFAULT_CUSTOMER_UI_COPY, fillCopy } from '@/constants/customerUiCopy';
import { colors, fonts, radii, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';
import type { CustomerUiCopy } from '@/types/api';

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

const SAVE_AS: { key: AddressSaveAs; labelKey: 'addrSaveHome' | 'addrSaveOffice' | 'addrSaveOther'; Icon: typeof Home }[] = [
  { key: 'Home', labelKey: 'addrSaveHome', Icon: Home },
  { key: 'Office', labelKey: 'addrSaveOffice', Icon: Building2 },
  { key: 'Other', labelKey: 'addrSaveOther', Icon: MapPinned },
];

type LineCopy = Pick<CustomerUiCopy, 'addrHousePrefix' | 'addrLandmarkPrefix'>;

/** "Flat/House A-302, street, Landmark: …" — the street line saved with a new address. */
export function composeStreetLine(v: AddressFormValues, copy: LineCopy = DEFAULT_CUSTOMER_UI_COPY): string {
  return [
    v.house.trim() ? fillCopy(copy.addrHousePrefix, { house: v.house.trim() }) : '',
    v.street.trim(),
    v.landmark.trim() ? fillCopy(copy.addrLandmarkPrefix, { landmark: v.landmark.trim() }) : '',
  ]
    .filter(Boolean)
    .join(', ');
}

/** Compose booking address string from structured fields. */
export function composeAddressLine(v: AddressFormValues, copy: LineCopy = DEFAULT_CUSTOMER_UI_COPY): string {
  return [composeStreetLine(v, copy), v.city.trim(), v.pincode.trim()].filter(Boolean).join(', ');
}

export function addressFormValid(v: AddressFormValues): boolean {
  return Boolean(v.house.trim() && v.street.trim() && v.city.trim());
}

/** Required fields still empty — drives the inline "Add this to continue" hints. */
export function missingAddressFields(v: AddressFormValues): (keyof AddressFormValues)[] {
  return (['house', 'street', 'city'] as const).filter((k) => !v[k].trim());
}

/** Premium structured address fields — house/flat, landmark, save-as. */
export function AddressDetailsForm({
  value,
  onChange,
  showSaveAs = true,
  showErrors = false,
}: {
  value: AddressFormValues;
  onChange: (next: AddressFormValues) => void;
  showSaveAs?: boolean;
  /** Mark empty required fields (after the customer tried to continue). */
  showErrors?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const missing = showErrors ? missingAddressFields(value) : [];
  const err = (k: keyof AddressFormValues) => (missing.includes(k) ? copy.addrFieldMissing : undefined);
  function patch(partial: Partial<AddressFormValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <View style={styles.wrap}>
      <Field
        label={copy.addrHouseLabel}
        required
        value={value.house}
        onChangeText={(house) => patch({ house })}
        placeholder={copy.addrHousePlaceholder}
        autoCapitalize="characters"
        error={err('house')}
      />
      <Field
        label={copy.addrStreetLabel}
        required
        value={value.street}
        onChangeText={(street) => patch({ street })}
        placeholder={copy.addrStreetPlaceholder}
        error={err('street')}
      />
      <Field
        label={copy.addrLandmarkLabel}
        optional
        value={value.landmark}
        onChangeText={(landmark) => patch({ landmark })}
        placeholder={copy.addrLandmarkPlaceholder}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Field
            label={copy.addrCityLabel}
            required
            value={value.city}
            onChangeText={(city) => patch({ city })}
            placeholder={copy.addrCityPlaceholder}
            error={err('city')}
          />
        </View>
        <View style={styles.pin}>
          <Field
            label={copy.addrPincodeLabel}
            optional
            value={value.pincode}
            onChangeText={(pincode) => patch({ pincode: pincode.replace(/[^\d]/g, '').slice(0, 6) })}
            placeholder={copy.addrPincodePlaceholder}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {showSaveAs ? (
        <View style={styles.saveBlock}>
          <Text style={styles.saveLabel}>{copy.addrSaveAsLabel}</Text>
          <View style={styles.saveRow}>
            {SAVE_AS.map(({ key, labelKey, Icon }) => {
              const on = value.saveAs === key;
              const label = copy[labelKey];
              return (
                <PressableScale
                  key={key}
                  onPress={() => {
                    if (!on) haptic('select');
                    patch({ saveAs: key });
                  }}
                  containerStyle={styles.saveChipWrap}
                  style={[styles.saveChip, on && styles.saveChipOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={fillCopy(copy.addrSaveAsA11y, { label })}
                >
                  <Icon size={15} color={on ? colors.white : ui.brand} strokeWidth={2.2} />
                  <Text style={[styles.saveChipText, on && styles.saveChipTextOn]}>{label}</Text>
                </PressableScale>
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
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}) {
  const copy = useCustomerUiCopy();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required ? <Text style={styles.req}>{copy.authRequired}</Text> : null}
        {optional ? <Text style={styles.opt}>{copy.authFieldOptional}</Text> : null}
      </View>
      <TextInput
        {...textInputDefaults}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ui.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        accessibilityLabel={label}
        accessibilityHint={error}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
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
  label: { ...typeScale.captionStrong, fontSize: 12.5, flex: 1, color: ui.textSecondary },
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
    borderRadius: radii.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.hairline,
    fontFamily: fonts.bodySemi,
    fontSize: TEXT_INPUT_FONT_SIZE,
    color: ui.text,
  },
  inputError: { borderColor: colors.amber, backgroundColor: colors.amberBg },
  error: { ...typeScale.caption, fontSize: 12, paddingHorizontal: 2, color: colors.amberInk },
  saveBlock: { gap: 8, marginTop: 2 },
  saveLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textSecondary,
    paddingHorizontal: 2,
  },
  saveRow: { flexDirection: 'row', gap: 8 },
  saveChipWrap: { flex: 1 },
  saveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radii.control,
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
});
