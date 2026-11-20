import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminFilterChips, AdminSearchField } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { WebsiteListCard } from '@/components/kit/WebsiteListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { BlogPostSummary } from '@/types/api';
import { colors, spacing } from '@/constants/theme';

type Filter = 'all' | 'published' | 'draft';

function postDate(p: BlogPostSummary): string {
  const iso = p.status === 'published' ? p.publishedAt ?? p.updatedAt : p.updatedAt;
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WebsiteBlogScreen() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim().toLowerCase(), 200);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    const { data } = await api.get<{ posts: BlogPostSummary[] }>('/website/admin/blog', { ...screenLoadConfig, skipCache: true });
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load blog posts');
  }, [load, runLoad]);

  // Back from the editor → quietly pick up the saved post.
  useStaleFocusRefresh(() => load().catch(() => undefined), 0);

  const counts = useMemo(() => {
    let published = 0;
    for (const p of posts) if (p.status === 'published') published += 1;
    return { all: posts.length, published, draft: posts.length - published };
  }, [posts]);

  const visible = useMemo(() => {
    const byStatus = filter === 'all' ? posts : posts.filter((p) => p.status === filter);
    if (!query) return byStatus;
    return byStatus.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.author.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)),
    );
  }, [posts, filter, query]);

  const open = useCallback((id?: string) => {
    appPush(id ? { pathname: adminRoutes.websiteBlogEdit, params: { id } } : adminRoutes.websiteBlogEdit);
  }, []);

  const header = useMemo(
    () => (
      <FadeSlideIn slideFrom={14}>
        <View style={styles.headerBlock}>
          <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search title, tag or author" />
          <View style={styles.chipsWrap}>
            <AdminFilterChips
              inset
              chips={[
                { key: 'all', label: `All (${counts.all})` },
                { key: 'published', label: `Published (${counts.published})` },
                { key: 'draft', label: `Drafts (${counts.draft})` },
              ]}
              selected={filter}
              onSelect={(k) => setFilter(k as Filter)}
            />
          </View>
        </View>
      </FadeSlideIn>
    ),
    [counts, filter, search],
  );

  if (loading) {
    return (
      <AdminListShell title="Blog" subtitle="Articles on the website" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="service" search chips rows={5} />
      </AdminListShell>
    );
  }

  if (error && posts.length === 0) {
    return (
      <AdminListShell title="Blog" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Blog"
      subtitle={`${counts.published} live · ${counts.draft} drafts`}
      backFallback={adminRoutes.website}
      rightAction={<AdminAddButton label="New post" onPress={() => open()} />}
    >
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        {...ADMIN_LIST_PERF}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={
          <EmptyState
            title={query ? 'No matching posts' : filter === 'draft' ? 'No drafts' : 'No posts yet'}
            message={query ? 'Try another word' : 'Write your first article for the website blog'}
            actionLabel={query ? undefined : 'Write a post'}
            onAction={query ? undefined : () => open()}
          />
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <WebsiteListCard
              photoUrl={item.cover?.url}
              photoShape="wide"
              title={item.title}
              subtitle={item.excerpt || undefined}
              badge={item.status === 'published' ? { label: 'LIVE', tone: 'live' } : { label: 'DRAFT', tone: 'draft' }}
              meta={[postDate(item), item.tags.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
              onPress={() => open(item.id)}
            />
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: { marginBottom: spacing.xs },
  chipsWrap: { marginHorizontal: -spacing.md },
});
