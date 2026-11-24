import { Bug, CalendarDays, CalendarPlus, Gauge, MapPin, Pencil } from 'lucide-react-native';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { useBusinessSettings } from '@/lib/businessSettings';
import { areaLabel, capLabel, hasCoverageRules, offDaysLabel } from '@/lib/coverage';
import { pestLabel } from '@/lib/settingsLabels';
import type { TechnicianCoverage } from '@/types/adminManage';

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.flex}>
        <Text style={styles.rowLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

/**
 * Technician detail: what they treat, where and when they work (auto-assign follows it), with shortcuts to
 * edit the rules and to add leave.
 */
export const TechnicianCoverageCard = memo(function TechnicianCoverageCard({
  coverage,
  onEdit,
  onAddLeave,
}: {
  coverage: TechnicianCoverage;
  onEdit: () => void;
  onAddLeave: () => void;
}) {
  const settings = useBusinessSettings();
  const skills = coverage.skills ?? [];
  const off = coverage.offDays ?? [];
  const icon = (I: typeof Bug) => <I size={15} color={colors.forest} strokeWidth={2.2} />;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.title}>Coverage</Text>
          <Text style={styles.hint}>
            {hasCoverageRules(coverage) ? 'Auto-assign follows these rules' : 'No rules yet — auto-assign can send any visit'}
          </Text>
        </View>
        <Pressable
          onPress={onEdit}
          hitSlop={6}
          style={({ pressed }) => [styles.headBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Edit coverage"
        >
          <Pencil size={14} color={ui.brand} strokeWidth={2.3} />
          <Text style={styles.headBtnText}>Edit</Text>
        </Pressable>
      </View>

      <Row icon={icon(Bug)} label="Skills">
        {skills.length ? (
          <View style={styles.chips}>
            {skills.map((k) => (
              <View key={k} style={styles.chip}>
                <Text style={styles.chipText}>{pestLabel(k, settings)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.value}>All pest types</Text>
        )}
      </Row>
      <Row icon={icon(MapPin)} label="Area">
        <Text style={styles.value}>{areaLabel(coverage, 4)}</Text>
        {(coverage.servicePincodes ?? []).length ? (
          <Text style={styles.sub} numberOfLines={2}>
            {(coverage.servicePincodes ?? []).join(', ')}
          </Text>
        ) : null}
      </Row>
      <Row icon={icon(CalendarDays)} label="Days">
        <Text style={[styles.value, off.length > 0 && styles.valueWarn]}>{offDaysLabel(off)}</Text>
      </Row>
      <Row icon={icon(Gauge)} label="Daily jobs">
        <Text style={styles.value}>{capLabel(coverage.maxJobsPerDay)}</Text>
      </Row>

      <Pressable
        onPress={onAddLeave}
        style={({ pressed }) => [styles.leaveBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Add leave"
      >
        <CalendarPlus size={16} color={ui.brand} strokeWidth={2.3} />
        <Text style={styles.leaveText}>Add leave</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  title: { fontFamily: fonts.displayExtra, fontSize: 15.5, color: ui.text, letterSpacing: -0.2 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  headBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  headBtnText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.brand },
  row: { flexDirection: 'row', gap: 10, paddingTop: 10 },
  icon: { width: 28, height: 28, borderRadius: 9, backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textTertiary, letterSpacing: 0.2 },
  value: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text, marginTop: 1 },
  valueWarn: { color: colors.amberInk },
  sub: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: ui.brandSoft },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  leaveText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
  pressed: { opacity: 0.7 },
});
