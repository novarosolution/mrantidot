import { Minus, Plus } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ToggleChips } from '@/components/admin/ToggleChips';
import { ChipsInput } from '@/components/kit/ChipsInput';
import { PestTypePicker } from '@/components/settings/PestTypePicker';
import { isServiceTypeKey, type ServiceTypeKey } from '@/constants/serviceTypes';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useBusinessSettings } from '@/lib/businessSettings';
import { MAX_JOBS_PER_DAY, WEEK } from '@/lib/coverage';
import { haptic } from '@/lib/motion';

/** What the editor holds — the user-edit screen sends it as-is (PATCH / POST /admin/users). */
export type CoverageDraft = {
  skills: string[];
  serviceCities: string[];
  servicePincodes: string[];
  offDays: number[];
  maxJobsPerDay: number | null;
};

export const EMPTY_COVERAGE: CoverageDraft = { skills: [], serviceCities: [], servicePincodes: [], offDays: [], maxJobsPerDay: null };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function SectionLabel({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.labelBlock}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

/**
 * Technician coverage for auto-assign and the assign picker: pest-type skills (none = every type), the cities /
 * pincodes they cover (picked from Business settings → Service area when it lists them), weekly days off and
 * an optional daily job cap.
 */
export const TechnicianCoverageEditor = memo(function TechnicianCoverageEditor({
  value,
  onChange,
}: {
  value: CoverageDraft;
  onChange: (patch: Partial<CoverageDraft>) => void;
}) {
  const settings = useBusinessSettings();
  const area = settings.serviceArea;
  const listed = area.mode === 'listed' && (area.cities.length > 0 || area.pincodes.length > 0);

  const skills = value.skills.filter(isServiceTypeKey) as ServiceTypeKey[];

  // Business cities first; cities this technician still has that the area no longer lists stay (dashed).
  const cityChips = [
    ...area.cities.map((c) => ({ key: c, label: c })),
    ...value.serviceCities
      .filter((c) => !area.cities.some((a) => same(a, c)))
      .map((c) => ({ key: c, label: c, hint: 'outside area', muted: true })),
  ];
  const selectedCities = value.serviceCities.map((c) => area.cities.find((a) => same(a, c)) ?? c);

  function toggleCity(key: string) {
    const has = value.serviceCities.some((c) => same(c, key));
    onChange({ serviceCities: has ? value.serviceCities.filter((c) => !same(c, key)) : [...value.serviceCities, key] });
  }

  function changePincodes(next: string[]) {
    const added = next.filter((p) => !value.servicePincodes.includes(p));
    const bad = added.find((p) => !/^\d{6}$/.test(p.replace(/\s+/g, '')));
    if (bad) {
      haptic('error');
      Toast.show({ type: 'error', text1: `${bad} is not a 6-digit pincode` });
      return;
    }
    const outside = listed ? added.find((p) => !area.pincodes.includes(p.replace(/\s+/g, ''))) : undefined;
    if (outside) {
      haptic('error');
      Toast.show({ type: 'error', text1: `${outside} is not in your service area`, text2: 'Add it in Business settings → Service area first.' });
      return;
    }
    onChange({ servicePincodes: next.map((p) => p.replace(/\s+/g, '')) });
  }

  function toggleDay(key: string) {
    const day = Number(key);
    const has = value.offDays.includes(day);
    if (!has && value.offDays.length >= 6) {
      haptic('warning');
      Toast.show({ type: 'info', text1: 'Keep at least one working day' });
      return;
    }
    onChange({ offDays: has ? value.offDays.filter((d) => d !== day) : [...value.offDays, day].sort((a, b) => a - b) });
  }

  const cap = value.maxJobsPerDay;
  const setCap = (next: number | null) => {
    haptic('select');
    onChange({ maxJobsPerDay: next });
  };

  const noArea = value.serviceCities.length === 0 && value.servicePincodes.length === 0;

  return (
    <View>
      <SectionLabel
        title="Skills"
        hint={skills.length ? 'Auto-assign only gives them visits for these pest types.' : 'None selected = handles every pest type.'}
      />
      <PestTypePicker value={skills} onChange={(next) => onChange({ skills: next })} />

      <SectionLabel
        title="Service area"
        hint={
          noArea
            ? 'Nothing picked = works anywhere in your service area.'
            : 'Auto-assign only sends visits whose address is in these cities or pincodes.'
        }
      />
      {area.mode === 'listed' ? (
        <>
          {cityChips.length ? (
            <ToggleChips chips={cityChips} selected={selectedCities} onToggle={toggleCity} accessibilityLabel="Cities they cover" />
          ) : (
            <Text style={styles.note}>Your service area lists pincodes only.</Text>
          )}
          {area.pincodes.length || value.servicePincodes.length ? (
            <View style={styles.pins}>
              <ChipsInput
                label="Pincodes"
                values={value.servicePincodes}
                onChange={changePincodes}
                max={60}
                maxLength={6}
                placeholder="Type a 6-digit pincode"
                hint={`Must be one of the ${area.pincodes.length} pincodes in Business settings → Service area.`}
              />
            </View>
          ) : null}
        </>
      ) : (
        <>
          <ChipsInput
            label="Cities"
            values={value.serviceCities}
            onChange={(next) => onChange({ serviceCities: next })}
            max={30}
            maxLength={60}
            placeholder="e.g. Ahmedabad"
            hint="Your service area is “Anywhere”, so any city can be added."
          />
          <ChipsInput label="Pincodes" values={value.servicePincodes} onChange={changePincodes} max={60} maxLength={6} placeholder="Type a 6-digit pincode" />
        </>
      )}

      <SectionLabel
        title="Weekly days off"
        hint={value.offDays.length ? 'Auto-assign skips them on these days; you can still assign by hand.' : 'Works every day of the week.'}
      />
      <ToggleChips
        chips={WEEK.map((w) => ({ key: String(w.day), label: w.short }))}
        selected={value.offDays.map(String)}
        onToggle={toggleDay}
        accessibilityLabel="Weekly days off"
      />

      <SectionLabel
        title="Jobs per day"
        hint={cap ? `Auto-assign stops at ${cap} job${cap === 1 ? '' : 's'} on a day.` : 'No daily limit.'}
      />
      {cap ? (
        <View style={styles.capRow}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setCap(cap > 1 ? cap - 1 : null)}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={cap > 1 ? 'One job fewer' : 'Remove the daily limit'}
              hitSlop={6}
            >
              <Minus size={16} color={ui.brand} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.capValue} accessibilityLiveRegion="polite" accessibilityLabel={`${cap} jobs a day`}>
              {cap}
            </Text>
            <Pressable
              onPress={() => cap < MAX_JOBS_PER_DAY && setCap(cap + 1)}
              disabled={cap >= MAX_JOBS_PER_DAY}
              style={({ pressed }) => [styles.stepBtn, cap >= MAX_JOBS_PER_DAY && styles.stepOff, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="One job more"
              accessibilityState={{ disabled: cap >= MAX_JOBS_PER_DAY }}
              hitSlop={6}
            >
              <Plus size={16} color={ui.brand} strokeWidth={2.6} />
            </Pressable>
          </View>
          <Pressable onPress={() => setCap(null)} hitSlop={8} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.link}>No limit</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setCap(4)}
          style={({ pressed }) => [styles.setCap, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Set a daily job limit"
        >
          <Plus size={15} color={ui.brand} strokeWidth={2.6} />
          <Text style={styles.setCapText}>Set a daily limit</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  labelBlock: { marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  note: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  pins: { marginTop: spacing.md },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  stepBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.brandSoft },
  stepOff: { opacity: 0.4 },
  capValue: { minWidth: 36, textAlign: 'center', fontFamily: fonts.displayExtra, fontSize: 17, color: ui.text },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  setCap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
  },
  setCapText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
  pressed: { opacity: 0.7 },
});
