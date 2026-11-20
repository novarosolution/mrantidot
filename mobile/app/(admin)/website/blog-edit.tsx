import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminCollapsibleCard, AdminFormCard } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { ChipsInput } from '@/components/kit/ChipsInput';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, useBusyCounter } from '@/components/kit/ImageField';
import { MarkdownEditor } from '@/components/kit/MarkdownEditor';
import { SegmentedTabs } from '@/components/kit/SegmentedTabs';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, slugify } from '@/constants/websiteAdmin';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { config } from '@/lib/config';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { BlogPost, BlogPostInput, BlogPostStatus, WebsiteImage } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

type Errors = Partial<Record<'title' | 'body' | 'cover', string>>;

/** Typing a link: lower-case letters, numbers and dashes only (trailing dash kept while typing). */
const slugTyping = (t: string) => t.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').slice(0, 80);

const BasicsCard = memo(function BasicsCard({
  title,
  slug,
  excerpt,
  author,
  errors,
  onTitle,
  onSlug,
  onExcerpt,
  onAuthor,
}: {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  errors: Errors;
  onTitle: (t: string) => void;
  onSlug: (t: string) => void;
  onExcerpt: (t: string) => void;
  onAuthor: (t: string) => void;
}) {
  const base = config.websiteUrl ? `${config.websiteUrl.replace(/^https?:\/\//, '')}/blog/` : '/blog/';
  return (
    <AdminFormCard>
      <Text style={styles.cardTitle}>Basics</Text>
      <Text style={styles.cardHint}>Title, link and the short summary on blog cards</Text>
      <IconInput label="Title" value={title} maxLength={160} onChangeText={onTitle} error={errors.title} />
      <IconInput
        label="Link"
        value={slug}
        autoCapitalize="none"
        maxLength={80}
        onChangeText={onSlug}
        placeholder="made-from-the-title"
        hint={`${base}${slugify(slug) || slugify(title) || '…'}`}
      />
      <IconInput
        label="Summary"
        value={excerpt}
        maxLength={300}
        multiline
        onChangeText={onExcerpt}
        placeholder="One or two sentences shown on the blog list"
        hint={`${excerpt.length}/300`}
      />
      <IconInput label="Author" value={author} maxLength={80} onChangeText={onAuthor} placeholder="e.g. Mr Antidot team" />
    </AdminFormCard>
  );
});

const SeoCard = memo(function SeoCard({
  seoTitle,
  seoDescription,
  fallbackTitle,
  fallbackDescription,
  onTitle,
  onDescription,
}: {
  seoTitle: string;
  seoDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
  onTitle: (t: string) => void;
  onDescription: (t: string) => void;
}) {
  return (
    <AdminCollapsibleCard
      title="Google & sharing"
      subtitle={seoTitle.trim() ? 'Custom search title set' : 'Uses the post title and summary'}
      defaultOpen={Boolean(seoTitle.trim() || seoDescription.trim())}
    >
      <IconInput
        label="Search title"
        value={seoTitle}
        maxLength={SEO_TITLE_MAX}
        onChangeText={onTitle}
        placeholder={fallbackTitle || 'Defaults to the post title'}
        hint={`${seoTitle.length}/${SEO_TITLE_MAX} characters`}
      />
      <IconInput
        label="Search description"
        value={seoDescription}
        maxLength={SEO_DESCRIPTION_MAX}
        multiline
        onChangeText={onDescription}
        placeholder="Defaults to the summary"
        hint={`${seoDescription.length}/${SEO_DESCRIPTION_MAX} characters`}
      />
      <View style={styles.serp}>
        <Text style={styles.serpLabel}>GOOGLE PREVIEW</Text>
        <Text style={styles.serpTitle} numberOfLines={1}>
          {seoTitle.trim() || fallbackTitle || 'Post title'}
        </Text>
        <Text style={styles.serpDesc} numberOfLines={2}>
          {seoDescription.trim() || fallbackDescription || 'The summary appears here.'}
        </Text>
      </View>
    </AdminCollapsibleCard>
  );
});

export default function WebsiteBlogEditScreen() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAuto, setSlugAuto] = useState(!id);
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('Mr Antidot');
  const [cover, setCover] = useState<WebsiteImage>({ url: '', alt: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [wasPublished, setWasPublished] = useState(false);
  const [hasLegacy, setHasLegacy] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, onBusyChange] = useBusyCounter();
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ post: BlogPost }>(`/website/admin/blog/${id}`, { ...screenLoadConfig, skipCache: true });
    const p = data.post;
    setTitle(p.title);
    setSlug(p.slug);
    setSlugAuto(false);
    setExcerpt(p.excerpt ?? '');
    setAuthor(p.author ?? '');
    setCover(p.cover ?? { url: '', alt: '' });
    setTags(p.tags ?? []);
    setBody(p.body ?? '');
    setStatus(p.status);
    setWasPublished(p.status === 'published');
    setHasLegacy(Boolean(p.legacyHtml?.trim()));
    setSeoTitle(p.seo?.title ?? '');
    setSeoDescription(p.seo?.description ?? '');
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load, 'Could not load this post');
  }, [id, load, runLoad]);

  // New posts take their link from the title until the admin edits the link by hand.
  const onTitle = useCallback(
    (t: string) => {
      setTitle(t);
      if (slugAuto) setSlug(slugify(t));
      setErrors((e) => (e.title ? { ...e, title: undefined } : e));
    },
    [slugAuto],
  );
  const onSlug = useCallback((t: string) => {
    setSlugAuto(false);
    setSlug(slugTyping(t));
  }, []);
  const onBody = useCallback((t: string) => {
    setBody(t);
    setErrors((e) => (e.body ? { ...e, body: undefined } : e));
  }, []);
  const onCover = useCallback((img: WebsiteImage) => {
    setCover(img);
    setErrors((e) => (e.cover ? { ...e, cover: undefined } : e));
  }, []);

  async function save() {
    const next: Errors = {};
    if (!title.trim()) next.title = 'Give the post a title';
    if (status === 'published' && !body.trim()) next.body = 'Write the article before publishing';
    if (cover.url && !cover.alt.trim()) next.cover = 'Add alt text for the cover photo';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: next.title ?? next.body ?? next.cover ?? 'Fix the highlighted fields' });
      return;
    }
    const input: BlogPostInput = {
      title: title.trim(),
      ...(slugify(slug) ? { slug: slugify(slug) } : {}),
      excerpt: excerpt.trim(),
      cover: { url: cover.url, alt: cover.alt.trim() },
      body,
      tags,
      author: author.trim(),
      status,
      seo: { title: seoTitle.trim(), description: seoDescription.trim() },
    };
    setSaving(true);
    try {
      if (id) await api.patch(`/website/admin/blog/${id}`, input, { skipErrorToast: true });
      else await api.post('/website/admin/blog', input, { skipErrorToast: true });
      haptic('success');
      Toast.show({
        type: 'success',
        text1: status === 'published' ? (wasPublished ? 'Post updated' : 'Post published') : 'Draft saved',
        text2: status === 'published' ? 'Live on the website within a minute' : 'Only admins can see drafts',
      });
      adminGoBack(adminRoutes.websiteBlog);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the post') });
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!id) return;
    Alert.alert('Delete this post?', `“${title || 'Untitled'}” will be removed from the website. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/website/admin/blog/${id}`, { skipErrorToast: true });
              haptic('success');
              Toast.show({ type: 'success', text1: 'Post deleted' });
              adminGoBack(adminRoutes.websiteBlog);
            } catch (err) {
              haptic('error');
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the post') });
            }
          })();
        },
      },
    ]);
  }

  if (id && loading) {
    return (
      <AdminListShell title="Edit post" subtitle="Blog article" backFallback={adminRoutes.websiteBlog}>
        <AdminFormSkeleton preview cards={[3, 1]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="Post" subtitle="Could not load" backFallback={adminRoutes.websiteBlog}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const saveTitle = status === 'published' ? (wasPublished ? 'Update post' : 'Publish') : 'Save draft';

  return (
    <AdminListShell
      title={id ? 'Edit post' : 'New post'}
      subtitle={status === 'published' ? 'Published on the blog' : 'Draft · not on the website yet'}
      backFallback={adminRoutes.websiteBlog}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row>
          {id ? (
            <Button title="Delete" variant="dangerOutline" onPress={remove} fullWidth={false} style={styles.footerSecondary} />
          ) : null}
          <Button
            title={uploading ? 'Uploading…' : saveTitle}
            variant="premium"
            onPress={() => void save()}
            loading={saving}
            disabled={saving || uploading}
            fullWidth={false}
            style={styles.footerPrimary}
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
          <View style={styles.statusWrap}>
            <SegmentedTabs
              tabs={[
                { key: 'draft', label: 'Draft' },
                { key: 'published', label: 'Published' },
              ]}
              selected={status}
              onSelect={(k) => {
                haptic('select');
                setStatus(k);
              }}
            />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <BasicsCard
            title={title}
            slug={slug}
            excerpt={excerpt}
            author={author}
            errors={errors}
            onTitle={onTitle}
            onSlug={onSlug}
            onExcerpt={setExcerpt}
            onAuthor={setAuthor}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminFormCard>
            <ImageField
              label="Cover photo"
              hint="Shown on the blog list and at the top of the article"
              value={cover}
              onChange={onCover}
              aspectRatio={16 / 9}
              onBusyChange={onBusyChange}
            />
            {errors.cover ? <Text style={styles.error}>{errors.cover}</Text> : null}
            <ChipsInput label="Tags" values={tags} onChange={setTags} max={8} hint="Up to 8 short topics, e.g. termites, monsoon" />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
          <AdminFormCard>
            {hasLegacy && !body.trim() ? (
              <Text style={styles.legacy}>
                Imported from the old website. Its old page is kept as a backup but is not shown — write the article here.
              </Text>
            ) : null}
            <MarkdownEditor label="Article" value={body} onChangeText={onBody} error={errors.body} />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(4)} slideFrom={14}>
          <SeoCard
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            fallbackTitle={title.trim()}
            fallbackDescription={excerpt.trim()}
            onTitle={setSeoTitle}
            onDescription={setSeoDescription}
          />
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  statusWrap: { marginTop: spacing.sm },
  cardTitle: { ...adminType.formTitle, fontSize: 16, color: ui.text },
  cardHint: { ...adminType.formSub, fontSize: 12, color: ui.textSecondary, marginBottom: spacing.md },
  error: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error, marginTop: -spacing.sm, marginBottom: spacing.sm },
  legacy: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.amberInk,
    backgroundColor: colors.amberBg,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
});
