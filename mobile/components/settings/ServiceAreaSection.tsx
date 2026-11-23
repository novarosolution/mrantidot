import { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CircleCheck, CircleX, MapPin } from 'lucide-react-native';
import { ChipsInput } from '@/components/kit/ChipsInput';
import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { SettingsNote, SettingsSubhead } from '@/components/settings/SettingsKit';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { DEFAULT_BUSINESS_SETTINGS } from '@/constants/businessSettingsDefaults';
import { addressInServiceArea } from '@/lib/settingsLabels';
import { haptic } from '@/lib/motion';
import type { BusinessSettings } from '@/types/api';
import { colors, fonts, formField, spacing, ui } from '@/constants/theme';

type Area = BusinessSettings['serviceArea'];

const MODES: { key: Area['mode']; label: string }[] = [
  { key: 'anywhere', label: 'Anywhere' },
  { key: 'listed', label: 'Listed areas only' },
];

export function serviceAreaProblem(area: Area): string | null {
  if (area.mode === 'listed' && area.cities.length === 0 && area.pincodes.length === 0) {
    return 'Add at least one city or pincode, or choose “Anywhere”';
  }
  return null;
}

export const ServiceAreaSection = memo(function ServiceAreaSection({
  area,
  onChange,
}: {
  area: Area;
  onChange: (next: Area) => void;
}) {
  const [test, setTest] = useState('');
  const [dropped, setDropped] = useState(0);
  const set = (patch: Partial<Area>) => onChange({ ...area, ...patch });
  const listed = area.mode === 'listed';

  const probe = test.trim();
  const probeIsPin = /^\d{6}$/.test(probe);
  const served = probe
    ? addressInServiceArea(probeIsPin ? { pincode: probe } : { city: probe, text: probe }, {
        ...DEFAULT_BUSINESS_SETTINGS,
        serviceArea: area,
      })
    : null;

  return (
    <>
      <View style={styles.seg}>
        <SegmentedTabs
          tabs={MODES}
          selected={area.mode}
          onSelect={(mode) => {
            haptic('select');
            set({ mode });
          }}
        />
      </View>
      <SettingsNote>
        {listed
          ? 'New bookings are accepted only when the address’s city or pincode is in a list below. Customers elsewhere see a polite “we don’t serve this area yet”.'
          : 'Bookings are accepted from any city or pincode.'}
      </SettingsNote>

      {listed ? (
        <>
          <ChipsInput
            label="Cities"
            values={area.cities}
            onChange={(cities) => set({ cities })}
            max={200}
            maxLength={60}
            placeholder="Add a city, e.g. Ahmedabad"
            hint="Matched without caring about capitals or spaces."
          />
          <ChipsInput
            label="Pincodes"
            values={area.pincodes}
            onChange={(values) => {
              const pins = values.map((v) => v.replace(/\s/g, '')).filter((v) => /^\d{6}$/.test(v));
              setDropped(values.length - pins.length);
              set({ pincodes: [...new Set(pins)] });
            }}
            max={2000}
            maxLength={6}
            placeholder="Add a 6-digit pincode"
            hint="Paste many at once, separated by commas."
          />
          {dropped > 0 ? <SettingsNote tone="warn">Skipped {dropped} entry that wasn’t a 6-digit pincode.</SettingsNote> : null}
          {serviceAreaProblem(area) ? <SettingsNote tone="warn">{serviceAreaProblem(area)}.</SettingsNote> : null}
        </>
      ) : null}

      <SettingsSubhead title="Check an address" aside="Uses the lists above" />
      <View style={styles.testRow}>
        <MapPin size={16} color={ui.brand} strokeWidth={2.3} />
        <TextInput
          {...textInputDefaults}
          value={test}
          onChangeText={setTest}
          placeholder="Pincode or city"
          placeholderTextColor={colors.muted}
          maxLength={60}
          style={styles.testInput}
          accessibilityLabel="Check a pincode or city"
        />
      </View>
      {served !== null ? (
        <View style={[styles.result, served ? styles.resultOk : styles.resultNo]} accessibilityLiveRegion="polite">
          {served ? (
            <CircleCheck size={16} color={ui.brand} strokeWidth={2.4} />
          ) : (
            <CircleX size={16} color={colors.error} strokeWidth={2.4} />
          )}
          <Text style={[styles.resultText, !served && styles.resultTextNo]}>
            {served ? `Bookings from “${probe}” are accepted` : `“${probe}” is outside your service area`}
          </Text>
        </View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  seg: { marginHorizontal: -spacing.md, marginBottom: spacing.sm },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    borderRadius: 14,
    backgroundColor: formField.bg,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
  },
  testInput: { flex: 1, minHeight: 44, paddingRight: 12, fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text },
  result: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm, padding: 10, borderRadius: 12 },
  resultOk: { backgroundColor: ui.brandSoft },
  resultNo: { backgroundColor: colors.errorBg },
  resultText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },
  resultTextNo: { color: colors.error },
});
