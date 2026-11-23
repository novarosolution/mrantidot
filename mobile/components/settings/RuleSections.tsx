import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Receipt, Smartphone, Wrench } from 'lucide-react-native';
import { IconInput } from '@/components/kit/IconInput';
import { formatRupeeFull } from '@/components/kit/format';
import { installedAppVersion } from '@/components/AppStatusGate';
import { ItemListEditor, NumberField, SettingsNote, SettingsSubhead, ToggleRow } from '@/components/settings/SettingsKit';
import { formatPercent } from '@/lib/settingsLabels';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import type { BusinessSettings, SettingsListItem } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/* ---------- Tax & invoice ---------- */

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const TaxInvoiceSection = memo(function TaxInvoiceSection({
  tax,
  invoice,
  onTax,
  onInvoice,
}: {
  tax: BusinessSettings['tax'];
  invoice: BusinessSettings['invoice'];
  onTax: (next: BusinessSettings['tax']) => void;
  onInvoice: (next: BusinessSettings['invoice']) => void;
}) {
  const pct = Number.isFinite(tax.gstPercent) ? tax.gstPercent : 0;
  const gst = Math.round((1000 * pct) / 100);
  const set = (patch: Partial<BusinessSettings['invoice']>) => onInvoice({ ...invoice, ...patch });
  const gstin = invoice.gstin.trim();

  return (
    <>
      <NumberField
        label="GST rate (%)"
        value={tax.gstPercent}
        onChange={(gstPercent) => onTax({ gstPercent })}
        min={0}
        max={40}
        decimals
        unit="%"
        hint="Charged on the price after any coupon. New bookings use the new rate; past invoices keep theirs."
        presets={[0, 5, 12, 18, 28]}
        formatPreset={(n) => `${n}%`}
      />
      <View style={styles.sample} accessibilityLabel="Sample bill">
        <Receipt size={16} color={ui.brand} strokeWidth={2.2} />
        <Text style={styles.sampleText}>
          Subtotal {formatRupeeFull(1000)} · GST {formatPercent(pct)}% {formatRupeeFull(gst)} ·{' '}
          <Text style={styles.sampleTotal}>Total {formatRupeeFull(1000 + gst)}</Text>
        </Text>
      </View>

      <SettingsSubhead title="Invoice details" aside="Printed when filled in" />
      <IconInput
        label="Invoice number prefix"
        value={invoice.prefix}
        onChangeText={(prefix) => set({ prefix: prefix.replace(/\s/g, '').toUpperCase() })}
        autoCapitalize="characters"
        maxLength={12}
        placeholder="INV-"
        hint={`Invoices read ${invoice.prefix || 'INV-'}1A2B3C4D (prefix + last 8 of the booking id).`}
        error={!invoice.prefix.trim() ? 'Add a prefix, e.g. INV-' : undefined}
      />
      <IconInput
        label="Legal business name"
        value={invoice.legalName}
        onChangeText={(legalName) => set({ legalName })}
        maxLength={120}
        placeholder="e.g. Mr Antidot Pest Control Pvt. Ltd."
      />
      <IconInput
        label="GSTIN"
        value={invoice.gstin}
        onChangeText={(v) => set({ gstin: v.replace(/\s/g, '').toUpperCase() })}
        autoCapitalize="characters"
        maxLength={15}
        placeholder="15 characters, e.g. 24ABCDE1234F1Z5"
        hint={gstin && !GSTIN_RE.test(gstin) ? 'This does not look like a 15-character GSTIN — please check it.' : 'Leave empty if you are not GST-registered.'}
      />
      <IconInput
        label="Business address"
        value={invoice.address}
        onChangeText={(address) => set({ address })}
        maxLength={300}
        multiline
        placeholder="Registered office address for the invoice"
      />
      <IconInput
        label="Invoice footer"
        value={invoice.footer}
        onChangeText={(footer) => set({ footer })}
        maxLength={300}
        multiline
        placeholder="Thank you for choosing trusted pest control & home care."
        hint="Last line of every invoice. Empty = the default thank-you line."
      />
    </>
  );
});

/* ---------- Booking rules ---------- */

const hrs = (n: number) => (n === 0 ? 'Off' : `${n} h`);

export const BookingRulesSection = memo(function BookingRulesSection({
  booking,
  onChange,
}: {
  booking: BusinessSettings['booking'];
  onChange: (next: BusinessSettings['booking']) => void;
}) {
  const set = (patch: Partial<BusinessSettings['booking']>) => onChange({ ...booking, ...patch });
  const pickerCap = booking.horizonDays + 1;

  return (
    <>
      <SettingsSubhead title="When customers can book" />
      <NumberField
        label="Earliest booking (minutes from now)"
        value={booking.leadMinutes}
        onChange={(leadMinutes) => set({ leadMinutes })}
        min={0}
        max={4320}
        unit="min"
        hint="A slot must start at least this long after the customer books. 0 = any slot that hasn't started."
        presets={[0, 30, 60, 120, 240]}
        formatPreset={(n) => (n === 0 ? 'None' : n < 60 ? `${n} min` : `${n / 60} h`)}
      />
      <NumberField
        label="Days shown in the date picker"
        value={booking.pickerDays}
        onChange={(pickerDays) => set({ pickerDays })}
        min={1}
        max={60}
        unit="days"
        hint="How many upcoming days the app and website offer to pick from."
        presets={[5, 7, 10, 14]}
      />
      {booking.pickerDays > pickerCap ? (
        <SettingsNote tone="warn">The picker can’t go past the booking window — it will show {pickerCap} days.</SettingsNote>
      ) : null}
      <NumberField
        label="Book up to (days ahead)"
        value={booking.horizonDays}
        onChange={(horizonDays) => set({ horizonDays })}
        min={1}
        max={365}
        unit="days"
        hint="The server refuses dates further out than this."
        presets={[14, 30, 60, 90, 180]}
      />

      <SettingsSubhead title="Changes by the customer" />
      <NumberField
        label="Cancel cut-off (hours before the visit)"
        value={booking.cancelCutoffHours}
        onChange={(cancelCutoffHours) => set({ cancelCutoffHours })}
        min={0}
        max={168}
        unit="hours"
        hint="Customers can’t cancel this close to the visit. 0 = any time before work starts."
        presets={[0, 2, 6, 12, 24]}
        formatPreset={hrs}
      />
      <NumberField
        label="Reschedule cut-off (hours before the visit)"
        value={booking.rescheduleCutoffHours}
        onChange={(rescheduleCutoffHours) => set({ rescheduleCutoffHours })}
        min={0}
        max={168}
        unit="hours"
        hint="Customers can’t move a visit this close to its start. 0 = any time before work starts."
        presets={[0, 2, 6, 12, 24]}
        formatPreset={hrs}
      />
      <NumberField
        label="Reschedules per booking"
        value={booking.maxReschedules}
        onChange={(maxReschedules) => set({ maxReschedules })}
        min={0}
        max={20}
        hint="How many times a customer may move one visit. 0 = unlimited."
        presets={[0, 1, 2, 3]}
        formatPreset={(n) => (n === 0 ? 'Unlimited' : String(n))}
      />

      <SettingsSubhead title="Workflow" />
      <ToggleRow
        title="Auto-confirm new bookings"
        body="Skip “pending”: the slot the customer picks is confirmed straight away (also when they reschedule)."
        value={booking.autoConfirm}
        onChange={(autoConfirm) => set({ autoConfirm })}
      />
      <ToggleRow
        title="Auto-assign a technician"
        body="Confirmed bookings get the least-busy technician who is free in that slot, on duty and not on leave."
        value={booking.autoAssign}
        onChange={(autoAssign) => set({ autoAssign })}
      />
      {booking.autoAssign && !booking.autoConfirm ? (
        <SettingsNote>Bookings still wait in “pending” until you confirm them; a technician is picked once they are confirmed.</SettingsNote>
      ) : null}
    </>
  );
});

/* ---------- Payments ---------- */

const PAYMENT_KEYS = ['upi_card', 'pay_after'] as const;

export const PaymentsSection = memo(function PaymentsSection({
  methods,
  defaults,
  onChange,
}: {
  methods: SettingsListItem[];
  defaults?: SettingsListItem[];
  onChange: (next: SettingsListItem[]) => void;
}) {
  const on = methods.filter((m) => m.active);
  return (
    <>
      <SettingsNote>
        Rename or switch off a way to pay. The first one that is on is chosen when the customer doesn’t pick.
      </SettingsNote>
      <ItemListEditor items={methods} onChange={onChange} defaults={defaults} fixed={PAYMENT_KEYS} labelMax={40} />
      {on.length === 0 ? <SettingsNote tone="warn">Keep at least one payment method on.</SettingsNote> : null}
    </>
  );
});

/* ---------- Customers ---------- */

export const CustomersSection = memo(function CustomersSection({
  customers,
  onChange,
}: {
  customers: BusinessSettings['customers'];
  onChange: (next: BusinessSettings['customers']) => void;
}) {
  const set = (patch: Partial<BusinessSettings['customers']>) => onChange({ ...customers, ...patch });
  return (
    <>
      <NumberField
        label="VIP after total spend (₹)"
        value={customers.vipSpend}
        onChange={(vipSpend) => set({ vipSpend })}
        min={0}
        max={10_000_000}
        unit="₹"
        presets={[1000, 2000, 5000, 10000]}
        formatPreset={(n) => formatRupeeFull(n)}
      />
      <NumberField
        label="VIP after number of bookings"
        value={customers.vipBookings}
        onChange={(vipBookings) => set({ vipBookings })}
        min={0}
        max={1000}
        presets={[2, 3, 5, 10]}
      />
      <View style={styles.sample}>
        <Text style={styles.sampleText}>
          A customer is <Text style={styles.sampleTotal}>VIP</Text> once they spend {formatRupeeFull(customers.vipSpend)} or
          book {customers.vipBookings} {customers.vipBookings === 1 ? 'time' : 'times'}.
        </Text>
      </View>
    </>
  );
});

/* ---------- App status ---------- */

const VERSION_RE = /^\d+(\.\d+){0,2}$/;
const isHttps = (v: string) => !v.trim() || /^https:\/\/\S+$/i.test(v.trim());

export function appStatusProblem(app: BusinessSettings['app']): string | null {
  if (app.minVersion.trim() && !VERSION_RE.test(app.minVersion.trim())) return 'Minimum version looks like 1.2.0';
  if (!isHttps(app.iosUrl) || !isHttps(app.androidUrl)) return 'Store links must start with https://';
  return null;
}

export const AppStatusSection = memo(function AppStatusSection({
  app,
  onChange,
}: {
  app: BusinessSettings['app'];
  onChange: (next: BusinessSettings['app']) => void;
}) {
  const copy = useCustomerUiCopy();
  const set = (patch: Partial<BusinessSettings['app']>) => onChange({ ...app, ...patch });
  const installed = installedAppVersion();
  const minBad = Boolean(app.minVersion.trim()) && !VERSION_RE.test(app.minVersion.trim());

  return (
    <>
      <ToggleRow
        title="Maintenance mode"
        body="Customers and technicians see a “be right back” screen. Admins keep full access."
        value={app.maintenance}
        onChange={(maintenance) => set({ maintenance })}
        tone="danger"
      />
      <IconInput
        label="Maintenance message"
        value={app.maintenanceMessage}
        onChangeText={(maintenanceMessage) => set({ maintenanceMessage })}
        maxLength={300}
        multiline
        placeholder={copy.appMaintenanceText}
        hint="Empty = the default words (Content → Customer screens → System)."
      />
      <View style={[styles.preview, app.maintenance && styles.previewLive]}>
        <View style={styles.previewIcon}>
          <Wrench size={16} color={colors.limeOnDark} strokeWidth={2.4} />
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewTitle}>{copy.appMaintenanceTitle}</Text>
          <Text style={styles.previewBody} numberOfLines={3}>
            {app.maintenanceMessage.trim() || copy.appMaintenanceText}
          </Text>
          <Text style={styles.previewState}>{app.maintenance ? 'Showing now (after you save)' : 'Preview — maintenance is off'}</Text>
        </View>
      </View>

      <SettingsSubhead title="Force update" />
      <IconInput
        label="Minimum app version"
        value={app.minVersion}
        onChangeText={(minVersion) => set({ minVersion: minVersion.replace(/[^0-9.]/g, '') })}
        keyboardType="decimal-pad"
        maxLength={20}
        placeholder="e.g. 1.2.0"
        error={minBad ? 'Use numbers like 1.2.0' : undefined}
        hint={`Older builds must update before they can continue. Empty = every version works.${installed ? ` This device runs ${installed}.` : ''}`}
      />
      <IconInput
        label="App Store link (iPhone)"
        value={app.iosUrl}
        onChangeText={(iosUrl) => set({ iosUrl: iosUrl.trim() })}
        autoCapitalize="none"
        keyboardType="url"
        maxLength={300}
        placeholder="https://apps.apple.com/…"
        error={!isHttps(app.iosUrl) ? 'Use a full link starting with https://' : undefined}
      />
      <IconInput
        label="Play Store link (Android)"
        value={app.androidUrl}
        onChangeText={(androidUrl) => set({ androidUrl: androidUrl.trim() })}
        autoCapitalize="none"
        keyboardType="url"
        maxLength={300}
        placeholder="https://play.google.com/store/apps/details?id=…"
        error={!isHttps(app.androidUrl) ? 'Use a full link starting with https://' : undefined}
      />
      {app.minVersion.trim() && (!app.iosUrl.trim() || !app.androidUrl.trim()) ? (
        <View style={styles.inlineNote}>
          <Smartphone size={14} color={colors.amberInk} strokeWidth={2.3} />
          <SettingsNote tone="warn">Without a store link that phone’s update screen has no “Update” button.</SettingsNote>
        </View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: 'rgba(8,123,53,0.18)',
    marginBottom: spacing.md,
  },
  sampleText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 19, color: ui.text },
  sampleTotal: { fontFamily: fonts.bodyBold, color: ui.brand },
  preview: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.deep,
    marginBottom: spacing.md,
    opacity: 0.88,
  },
  previewLive: { opacity: 1 },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(185,229,138,0.14)',
  },
  previewText: { flex: 1, minWidth: 0 },
  previewTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },
  previewBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  previewState: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.limeOnDark, marginTop: 6 },
  inlineNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
});
