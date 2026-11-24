import { Crown, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SegmentedToggle } from '@/components/admin/AdminFilterBar';
import { formatINR } from '@/components/charts/chartFormat';
import { ChipsInput } from '@/components/kit/ChipsInput';
import { Spinner } from '@/components/ui/Spinner';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { haptic } from '@/lib/motion';
import type { AdminCustomerProfile, CustomerTagCount, VipOverride } from '@/types/adminManage';

type StatusTag = 'active' | 'inactive' | 'vip';
type VipChoice = 'auto' | VipOverride;

const MAX_TAGS = 12;

/**
 * Tags (free text, shared spelling across customers, filterable on the customers list) and the VIP badge:
 * Auto (Business settings → Customers rule), always VIP, or never VIP. Saves straight away —
 * PATCH /admin/customers/:id { tags } / { vipOverride }.
 */
export function AdminCustomerTags({
  customerId,
  tags,
  vipOverride,
  statusTag,
  onChange,
}: {
  customerId: string;
  tags: string[];
  vipOverride: VipOverride | null;
  statusTag: StatusTag;
  onChange: (next: { customer: AdminCustomerProfile; statusTag: StatusTag }) => void;
}) {
  const settings = useBusinessSettings();
  const [saving, setSaving] = useState<null | 'tags' | 'vip'>(null);
  const [draftTags, setDraftTags] = useState(tags);
  const [choice, setChoice] = useState<VipChoice>(vipOverride ?? 'auto');
  const [popular, setPopular] = useState<CustomerTagCount[]>([]);
  /** Only the newest save may update the screen (quick edits overlap). */
  const seq = useRef(0);

  const tagsKey = tags.join('\u0001');
  // Follow the saved tags (after a save or a reload), not every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraftTags(tags), [tagsKey]);
  useEffect(() => setChoice(vipOverride ?? 'auto'), [vipOverride]);

  useEffect(() => {
    let alive = true;
    api
      .get<{ tags: CustomerTagCount[] }>('/admin/customer-tags', screenLoadConfig)
      .then(({ data }) => alive && setPopular(data.tags))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function save(body: { tags?: string[]; vipOverride?: VipOverride | null }, kind: 'tags' | 'vip', rollback: () => void) {
    setSaving(kind);
    const mine = ++seq.current;
    try {
      const { data } = await api.patch<{ customer: AdminCustomerProfile; statusTag: StatusTag }>(`/admin/customers/${customerId}`, body, {
        skipErrorToast: true,
      });
      haptic('success');
      if (mine === seq.current) onChange(data);
      if (kind === 'vip') {
        Toast.show({
          type: 'success',
          text1: body.vipOverride === 'vip' ? 'Marked VIP' : body.vipOverride === 'not_vip' ? 'Not VIP' : 'VIP follows the rule again',
        });
      }
    } catch (err) {
      haptic('error');
      if (mine === seq.current) rollback();
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, kind === 'vip' ? 'Could not change VIP' : 'Could not save tags') });
    } finally {
      if (mine === seq.current) setSaving(null);
    }
  }

  function changeTags(next: string[]) {
    const before = draftTags;
    setDraftTags(next);
    void save({ tags: next }, 'tags', () => setDraftTags(before));
  }

  function changeVip(next: VipChoice) {
    if (next === choice) return;
    const before = choice;
    setChoice(next);
    void save({ vipOverride: next === 'auto' ? null : next }, 'vip', () => setChoice(before));
  }

  const rule = settings.customers;
  const ruleParts = [
    rule.vipSpend > 0 ? `spend ${formatINR(rule.vipSpend)}+` : '',
    rule.vipBookings > 0 ? `${rule.vipBookings}+ bookings` : '',
  ].filter(Boolean);
  const ruleText = ruleParts.length ? `Rule: ${ruleParts.join(' or ')} (Business settings)` : 'The VIP rule is switched off in Business settings';
  const vipHint =
    choice === 'vip'
      ? 'Always VIP, whatever they spend.'
      : choice === 'not_vip'
        ? 'Never VIP, even when the rule says so.'
        : `${statusTag === 'vip' ? 'VIP now' : 'Not VIP now'} · ${ruleText}`;

  const suggestions = popular
    .filter((p) => !draftTags.some((t) => t.toLowerCase() === p.tag.toLowerCase()))
    .slice(0, 6);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Tags & VIP</Text>
        {saving ? <Spinner /> : null}
      </View>

      <View style={styles.vipRow}>
        <View style={[styles.crown, statusTag === 'vip' && styles.crownOn]}>
          <Crown size={15} color={statusTag === 'vip' ? colors.white : ui.textTertiary} strokeWidth={2.2} />
        </View>
        <View style={styles.flex}>
          <SegmentedToggle<VipChoice>
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'vip', label: 'VIP' },
              { value: 'not_vip', label: 'Not VIP' },
            ]}
            value={choice}
            onChange={changeVip}
          />
        </View>
      </View>
      <Text style={styles.hint}>{vipHint}</Text>

      <View style={styles.tags}>
        <ChipsInput
          label="Tags"
          values={draftTags}
          onChange={changeTags}
          max={MAX_TAGS}
          maxLength={24}
          placeholder="e.g. Society A, Pays late"
          hint="Only admins see tags. Filter the customer list by tag."
        />
        {suggestions.length && draftTags.length < MAX_TAGS ? (
          <View style={styles.suggest}>
            <Text style={styles.suggestLabel}>In use</Text>
            {suggestions.map((s) => (
              <Pressable
                key={s.tag}
                onPress={() => {
                  haptic('select');
                  changeTags([...draftTags, s.tag]);
                }}
                style={({ pressed }) => [styles.suggestChip, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Add tag ${s.tag}, used on ${s.count} customers`}
              >
                <Plus size={12} color={ui.brand} strokeWidth={2.6} />
                <Text style={styles.suggestText}>{s.tag}</Text>
                <Text style={styles.suggestCount}>{s.count}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, minHeight: 24 },
  title: { fontFamily: fonts.displayExtra, fontSize: 15.5, color: ui.text, letterSpacing: -0.2 },
  vipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crown: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.surfaceMuted, marginBottom: spacing.sm },
  crownOn: { backgroundColor: colors.amberInk },
  flex: { flex: 1, minWidth: 0 },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: -2 },
  tags: { marginTop: spacing.md },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: -spacing.xs },
  suggestLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textTertiary, marginRight: 2 },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.35)',
  },
  suggestText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.brand },
  suggestCount: { fontFamily: fonts.body, fontSize: 11, color: ui.textTertiary },
  pressed: { opacity: 0.7 },
});
