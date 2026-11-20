import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminCollapsibleCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import {
  isHttpsUrl,
  isSafeLink,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  WEBSITE_SEO_PAGES,
} from '@/constants/websiteAdmin';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminRoutes } from '@/lib/routes';
import { useWebsiteConfig } from '@/lib/useWebsiteConfig';
import type {
  WebsiteAnnouncement,
  WebsiteAnnouncementMode,
  WebsiteConfig,
  WebsiteSeoEntry,
  WebsiteSeoPage,
  WebsiteSocial,
} from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type Focus = 'social' | 'seo' | 'announcement';

const SOCIAL_FIELDS: { key: keyof WebsiteSocial; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourname' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@yourchannel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/yourcompany' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourname' },
];

const ANNOUNCEMENT_MODES: { key: WebsiteAnnouncementMode; label: string }[] = [
  { key: 'offer', label: 'Offer' },
  { key: 'custom', label: 'Custom text' },
  { key: 'off', label: 'Off' },
];

type Draft = Pick<WebsiteConfig, 'social' | 'seo' | 'announcement'>;

const pick = (w: WebsiteConfig): Draft => ({ social: w.social, seo: w.seo, announcement: w.announcement });

/* ---------- social ---------- */

const SocialFields = memo(function SocialFields({
  social,
  showErrors,
  onChange,
}: {
  social: WebsiteSocial;
  showErrors: boolean;
  onChange: (key: keyof WebsiteSocial, value: string) => void;
}) {
  return (
    <>
      <Text style={styles.note}>Full https links. Leave a box empty to hide that icon on the website.</Text>
      {SOCIAL_FIELDS.map((f) => (
        <IconInput
          key={f.key}
          label={f.label}
          value={social[f.key]}
          placeholder={f.placeholder}
          autoCapitalize="none"
          keyboardType="url"
          maxLength={500}
          onChangeText={(v) => onChange(f.key, v)}
          error={showErrors && !isHttpsUrl(social[f.key]) ? 'Use a full link starting with https://' : undefined}
        />
      ))}
    </>
  );
});

/* ---------- SEO ---------- */

const SeoEditor = memo(function SeoEditor({
  seo,
  onChange,
}: {
  seo: Record<WebsiteSeoPage, WebsiteSeoEntry>;
  onChange: (page: WebsiteSeoPage, patch: Partial<WebsiteSeoEntry>) => void;
}) {
  const [page, setPage] = useState<WebsiteSeoPage>('home');
  const entry = seo[page] ?? { title: '', description: '' };
  const label = WEBSITE_SEO_PAGES.find((p) => p.key === page)?.label ?? page;

  return (
    <>
      <Text style={styles.note}>
        How each page appears in Google and in shared links. Empty boxes use the website’s default text.
      </Text>
      <AdminFilterChips
        chips={WEBSITE_SEO_PAGES.map((p) => ({
          key: p.key,
          label: seo[p.key]?.title.trim() ? `${p.label} ✓` : p.label,
        }))}
        selected={page}
        onSelect={(k) => setPage(k as WebsiteSeoPage)}
      />
      <IconInput
        label={`${label} page title`}
        value={entry.title}
        maxLength={SEO_TITLE_MAX}
        placeholder="e.g. Pest Control in Ahmedabad | Mr Antidot"
        onChangeText={(title) => onChange(page, { title })}
        hint={`${entry.title.length}/${SEO_TITLE_MAX} characters · 50–60 reads best`}
      />
      <IconInput
        label={`${label} page description`}
        value={entry.description}
        maxLength={SEO_DESCRIPTION_MAX}
        multiline
        placeholder="One or two sentences that make people click"
        onChangeText={(description) => onChange(page, { description })}
        hint={`${entry.description.length}/${SEO_DESCRIPTION_MAX} characters · 120–160 reads best`}
      />
      <View style={styles.serp} accessibilityLabel="Google preview">
        <Text style={styles.serpLabel}>GOOGLE PREVIEW</Text>
        <Text style={styles.serpTitle} numberOfLines={1}>
          {entry.title.trim() || 'Default page title'}
        </Text>
        <Text style={styles.serpDesc} numberOfLines={2}>
          {entry.description.trim() || 'The website’s default description is used until you write one.'}
        </Text>
      </View>
    </>
  );
});

/* ---------- announcement ---------- */

const AnnouncementFields = memo(function AnnouncementFields({
  value,
  showErrors,
  onChange,
}: {
  value: WebsiteAnnouncement;
  showErrors: boolean;
  onChange: (patch: Partial<WebsiteAnnouncement>) => void;
}) {
  return (
    <>
      <Text style={styles.note}>The thin bar at the very top of every page.</Text>
      <View style={styles.segWrap}>
        <SegmentedTabs
          tabs={ANNOUNCEMENT_MODES}
          selected={value.mode}
          onSelect={(mode) => {
            haptic('select');
            onChange({ mode });
          }}
        />
      </View>
      {value.mode === 'offer' ? (
        <Text style={styles.modeHint}>Shows your newest live offer from the Offers screen automatically.</Text>
      ) : null}
      {value.mode === 'off' ? <Text style={styles.modeHint}>No bar is shown on the website.</Text> : null}
      {value.mode === 'custom' ? (
        <>
          <IconInput
            label="Message"
            value={value.text}
            maxLength={160}
            placeholder="e.g. Monsoon special: 20% off termite treatment"
            onChangeText={(text) => onChange({ text })}
            hint={`${value.text.length}/160 characters`}
            error={showErrors && !value.text.trim() ? 'Write the message, or pick Offer / Off' : undefined}
          />
          <IconInput
            label="Link (optional)"
            value={value.link}
            maxLength={500}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="/offers or https://…"
            onChangeText={(link) => onChange({ link })}
            hint="A website page like /contact, or a full https:// link"
            error={showErrors && !isSafeLink(value.link) ? 'Use a page like /offers or a link starting with https://' : undefined}
          />
          <View style={styles.barPreview}>
            <Text style={styles.barText} numberOfLines={2}>
              {value.text.trim() || 'Your message appears here'}
            </Text>
          </View>
        </>
      ) : null}
    </>
  );
});

/* ---------- screen ---------- */

export default function WebsiteSettingsScreen() {
  const focus = paramString(useLocalSearchParams<{ focus?: string | string[] }>().focus) as Focus | undefined;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const { website, loading, error, saving, save, retry } = useWebsiteConfig(useCallback((w) => setDraft(pick(w)), []));

  const onSocial = useCallback(
    (key: keyof WebsiteSocial, value: string) => setDraft((d) => d && { ...d, social: { ...d.social, [key]: value } }),
    [],
  );
  const onSeo = useCallback(
    (page: WebsiteSeoPage, patch: Partial<WebsiteSeoEntry>) =>
      setDraft((d) => d && { ...d, seo: { ...d.seo, [page]: { ...d.seo[page], ...patch } } }),
    [],
  );
  const onAnnouncement = useCallback(
    (patch: Partial<WebsiteAnnouncement>) => setDraft((d) => d && { ...d, announcement: { ...d.announcement, ...patch } }),
    [],
  );

  const dirty = useMemo(
    () => Boolean(website && draft && JSON.stringify(draft) !== JSON.stringify(pick(website))),
    [website, draft],
  );

  async function onSave() {
    if (!draft) return;
    const social = Object.fromEntries(
      Object.entries(draft.social).map(([k, v]) => [k, v.trim()]),
    ) as unknown as WebsiteSocial;
    const announcement: WebsiteAnnouncement = {
      mode: draft.announcement.mode,
      text: draft.announcement.text.trim(),
      link: draft.announcement.link.trim(),
    };
    const socialOk = Object.values(social).every(isHttpsUrl);
    const announcementOk =
      announcement.mode !== 'custom' || (Boolean(announcement.text) && isSafeLink(announcement.link));
    if (!socialOk || !announcementOk) {
      setShowErrors(true);
      haptic('error');
      Toast.show({
        type: 'error',
        text1: !socialOk ? 'Check the social links' : 'Check the announcement bar',
        text2: 'Open the section to see what to fix',
      });
      return;
    }
    const seo = Object.fromEntries(
      Object.entries(draft.seo).map(([k, v]) => [k, { title: v.title.trim(), description: v.description.trim() }]),
    ) as Draft['seo'];
    const ok = await save({ social, seo, announcement }, 'Settings saved');
    if (ok) setShowErrors(false);
  }

  if (loading || (!draft && !error)) {
    return (
      <AdminListShell title="Social, SEO & bar" subtitle="Website settings" backFallback={adminRoutes.website}>
        <AdminFormSkeleton cards={[3, 2]} />
      </AdminListShell>
    );
  }

  if (error || !draft) {
    return (
      <AdminListShell title="Social, SEO & bar" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error ?? undefined} onRetry={() => void retry()} />
      </AdminListShell>
    );
  }

  const socialCount = Object.values(draft.social).filter((v) => v.trim()).length;
  const seoCount = Object.values(draft.seo).filter((v) => v.title.trim()).length;
  const modeLabel = ANNOUNCEMENT_MODES.find((m) => m.key === draft.announcement.mode)?.label ?? 'Offer';
  const openAll = !focus;

  return (
    <AdminListShell
      title="Social, SEO & bar"
      subtitle="Links, Google results and the top bar"
      backFallback={adminRoutes.website}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button
            title={dirty ? 'Save settings' : 'Saved'}
            variant="premium"
            loading={saving}
            disabled={!dirty || saving}
            onPress={() => void onSave()}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <AdminCollapsibleCard
            title="Social links"
            subtitle={socialCount ? `${socialCount} of 5 linked` : 'No links yet'}
            defaultOpen={openAll || focus === 'social'}
          >
            <SocialFields social={draft.social} showErrors={showErrors} onChange={onSocial} />
          </AdminCollapsibleCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminCollapsibleCard
            title="SEO"
            subtitle={`${seoCount} of ${WEBSITE_SEO_PAGES.length} pages have their own title`}
            defaultOpen={openAll || focus === 'seo'}
          >
            <SeoEditor seo={draft.seo} onChange={onSeo} />
          </AdminCollapsibleCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminCollapsibleCard
            title="Announcement bar"
            subtitle={`Showing: ${modeLabel}`}
            defaultOpen={openAll || focus === 'announcement'}
          >
            <AnnouncementFields value={draft.announcement} showErrors={showErrors} onChange={onAnnouncement} />
          </AdminCollapsibleCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary, marginBottom: spacing.md },
  segWrap: { marginHorizontal: -spacing.md },
  modeHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: ui.textSecondary,
    marginBottom: spacing.sm,
  },
  serp: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    gap: 4,
  },
  serpLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: ui.textTertiary },
  serpTitle: { fontFamily: fonts.bodySemi, fontSize: 16, color: '#1A0DAB' },
  serpDesc: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#4D5156' },
  barPreview: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
  },
  barText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.white, textAlign: 'center' },
});
