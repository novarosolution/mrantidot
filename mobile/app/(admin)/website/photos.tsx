import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormCard, AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { ImageField, imagesHaveAlt, useBusyCounter } from '@/components/kit/ImageField';
import { ListEditor, type ListSetter } from '@/components/kit/ListEditor';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useWebsiteConfig } from '@/lib/useWebsiteConfig';
import type { WebsiteImage, WebsiteImages, WebsitePageHeaderKey } from '@/types/api';
import { fonts, spacing, ui } from '@/constants/theme';

const EMPTY: WebsiteImage = { url: '', alt: '' };

const PAGE_HEADERS: { key: WebsitePageHeaderKey; label: string }[] = [
  { key: 'services', label: 'Services page' },
  { key: 'about', label: 'About page' },
  { key: 'blog', label: 'Blog' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'team', label: 'Team' },
  { key: 'contact', label: 'Contact' },
];

const slideTitle = (s: WebsiteImage, i: number) => s.alt.trim() || `Slide ${i + 1}`;
const slideSub = (s: WebsiteImage) => (s.url ? undefined : 'No photo yet — open to add one');

/** Draft keeps both why-us slots so each has its own field; empty ones are dropped on save. */
type Draft = Omit<WebsiteImages, 'why'> & { why: [WebsiteImage, WebsiteImage] };

function toDraft(images: WebsiteImages): Draft {
  return { ...images, why: [images.why[0] ?? EMPTY, images.why[1] ?? EMPTY] };
}

function toPayload(d: Draft): WebsiteImages {
  return { ...d, why: d.why.filter((w) => w.url), heroSlides: d.heroSlides.filter((s) => s.url) };
}

export default function WebsitePhotosScreen() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, onBusyChange] = useBusyCounter();
  const { website, loading, error, saving, save, retry } = useWebsiteConfig(
    useCallback((w) => setDraft(toDraft(w.images)), []),
  );

  const setSlides: ListSetter<WebsiteImage> = useCallback(
    (fn) => setDraft((d) => d && { ...d, heroSlides: fn(d.heroSlides) }),
    [],
  );
  const renderSlide = useCallback(
    (item: WebsiteImage, update: (patch: Partial<WebsiteImage>) => void, index: number) => (
      <ImageField
        label={`Slide ${index + 1}`}
        hint={index === 0 ? 'Shown first and loaded fastest — pick your best photo' : undefined}
        value={item}
        onChange={update}
        aspectRatio={16 / 9}
        onBusyChange={onBusyChange}
      />
    ),
    [onBusyChange],
  );
  const pageHeaderSetters = useMemo(
    () =>
      Object.fromEntries(
        PAGE_HEADERS.map(({ key }) => [
          key,
          (img: WebsiteImage) => setDraft((d) => d && { ...d, pageHeaders: { ...d.pageHeaders, [key]: img } }),
        ]),
      ) as Record<WebsitePageHeaderKey, (img: WebsiteImage) => void>,
    [],
  );
  const setAbout = useCallback((about: WebsiteImage) => setDraft((d) => d && { ...d, about }), []);
  const setOg = useCallback((og: WebsiteImage) => setDraft((d) => d && { ...d, og }), []);
  const setPageHeader = useCallback((pageHeader: WebsiteImage) => setDraft((d) => d && { ...d, pageHeader }), []);
  const setWhy1 = useCallback((img: WebsiteImage) => setDraft((d) => d && { ...d, why: [img, d.why[1]] }), []);
  const setWhy2 = useCallback((img: WebsiteImage) => setDraft((d) => d && { ...d, why: [d.why[0], img] }), []);

  const dirty = useMemo(
    () => Boolean(website && draft && JSON.stringify(toPayload(draft)) !== JSON.stringify(website.images)),
    [website, draft],
  );

  async function onSave() {
    if (!draft) return;
    const all = [draft.about, draft.og, draft.pageHeader, ...draft.why, ...draft.heroSlides, ...Object.values(draft.pageHeaders)];
    if (!imagesHaveAlt(all)) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Add alt text to every photo', text2: 'A few words that describe each picture' });
      return;
    }
    await save({ images: toPayload(draft) }, 'Photos saved');
  }

  if (loading || (!draft && !error)) {
    return (
      <AdminListShell title="Photos" subtitle="Website pictures" backFallback={adminRoutes.website}>
        <AdminFormSkeleton cards={[2, 1, 2]} />
      </AdminListShell>
    );
  }

  if (error || !draft) {
    return (
      <AdminListShell title="Photos" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error ?? undefined} onRetry={() => void retry()} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Photos"
      subtitle="Website pictures · JPG or PNG up to 8 MB"
      backFallback={adminRoutes.website}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button
            title={uploading ? 'Uploading photo…' : dirty ? 'Save photos' : 'Saved'}
            variant="premium"
            loading={saving}
            disabled={!dirty || saving || uploading}
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
          <AdminTabHint
            title="Tap a photo to replace it"
            body="Photos are resized and sent as JPG. Alt text describes the picture for Google and for people using screen readers."
          />
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminSectionTitle title="Hero slideshow" hint="Full-screen photos at the top of the home page" />
          <AdminFormCard>
            <ListEditor
              title="Slides"
              hint="Wide, bright photos of real jobs look best. They fade and zoom slowly, one every 6 seconds."
              items={draft.heroSlides}
              setItems={setSlides}
              makeItem={() => ({ ...EMPTY })}
              max={6}
              itemTitle={slideTitle}
              itemSubtitle={slideSub}
              renderFields={renderSlide}
              addLabel="Add slide"
              emptyText="No slides — the hero shows a plain green background."
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminSectionTitle title="Home page" hint="The why-us block" />
          <AdminFormCard>
            <ImageField
              label="Why-us photo 1"
              value={draft.why[0]}
              onChange={setWhy1}
              aspectRatio={1}
              onBusyChange={onBusyChange}
            />
            <ImageField
              label="Why-us photo 2"
              value={draft.why[1]}
              onChange={setWhy2}
              aspectRatio={1}
              onBusyChange={onBusyChange}
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
          <AdminSectionTitle title="About page" />
          <AdminFormCard>
            <ImageField
              label="About photo"
              hint="Shown beside the about intro"
              value={draft.about}
              onChange={setAbout}
              aspectRatio={4 / 3}
              onBusyChange={onBusyChange}
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(4)} slideFrom={14}>
          <AdminSectionTitle title="Sharing & page headers" />
          <AdminFormCard>
            <ImageField
              label="Share image"
              hint="Preview picture when a link is shared on WhatsApp, Facebook or X (1200 × 630 works best)"
              value={draft.og}
              onChange={setOg}
              aspectRatio={1200 / 630}
              onBusyChange={onBusyChange}
            />
            <ImageField
              label="Default page header"
              hint="Used by any page below that has no photo of its own. Leave empty for the plain header."
              value={draft.pageHeader}
              onChange={setPageHeader}
              aspectRatio={16 / 6}
              onBusyChange={onBusyChange}
            />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(5)} slideFrom={14}>
          <AdminSectionTitle title="Page headers" hint="Wide photo behind each page title" />
          <AdminFormCard>
            {PAGE_HEADERS.map(({ key, label }) => (
              <ImageField
                key={key}
                label={label}
                value={draft.pageHeaders[key] ?? EMPTY}
                onChange={pageHeaderSetters[key]}
                aspectRatio={16 / 6}
                onBusyChange={onBusyChange}
              />
            ))}
          </AdminFormCard>
        </FadeSlideIn>
        <Text style={styles.foot}>Changes go live on the website within a minute of saving.</Text>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  foot: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textSecondary,
  },
});
