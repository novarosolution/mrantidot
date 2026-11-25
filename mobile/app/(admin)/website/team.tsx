import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import {
  ADMIN_STICKY_FOOTER_PAD,
  AdminEntrance,
  AdminListShell,
  adminListShellStyles,
  useListEntrance,
} from '@/components/kit/AdminListShell';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { WebsiteListCard } from '@/components/kit/WebsiteListCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { useReorderMode } from '@/lib/useReorderMode';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { TeamMember } from '@/types/api';
import { useWebsiteItemRestored } from '@/lib/websiteTrash';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export default function WebsiteTeamScreen() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);
  const order = useReorderMode(members, setMembers, '/website/admin/team/order');

  const load = useCallback(async () => {
    const { data } = await api.get<{ members: TeamMember[] }>('/website/admin/team', { ...screenLoadConfig, skipCache: true });
    setMembers(data.members);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load the team');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => {
    if (!order.reordering) return load().catch(() => undefined);
  }, 0);
  useWebsiteItemRestored('team', () => {
    if (!order.reordering) void load().catch(() => undefined);
  });

  const shown = useMemo(() => members.filter((m) => m.active).length, [members]);
  const open = useCallback(
    (id?: string) => appPush(id ? { pathname: adminRoutes.websiteTeamEdit, params: { id } } : adminRoutes.websiteTeamEdit),
    [],
  );

  if (loading) {
    return (
      <AdminListShell title="Team" subtitle="People on the website" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="person" strip stripCells={3} rows={5} />
      </AdminListShell>
    );
  }

  if (error && members.length === 0) {
    return (
      <AdminListShell title="Team" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const header = (
    <FadeSlideIn slideFrom={14}>
      <View style={styles.headerBlock}>
        <AdminStatStrip
          flush
          items={[
            { label: 'People', value: members.length },
            { label: 'Shown', value: shown, color: colors.forest },
            { label: 'Hidden', value: members.length - shown, color: colors.muted },
          ]}
        />
        {order.reordering ? (
          <Text style={styles.hint}>Use the arrows to set the order people appear on the website.</Text>
        ) : members.length > 1 ? (
          <Pressable
            onPress={order.start}
            style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <ArrowUpDown size={15} color={ui.brand} strokeWidth={2.4} />
            <Text style={styles.reorderText}>Reorder</Text>
          </Pressable>
        ) : null}
      </View>
    </FadeSlideIn>
  );

  return (
    <AdminListShell
      title="Team"
      subtitle={order.reordering ? 'Reordering people' : `${shown} of ${members.length} shown on the website`}
      backFallback={adminRoutes.website}
      rightAction={order.reordering ? undefined : <AdminAddButton label="Add team member" onPress={() => open()} />}
      stickyFooter={
        order.reordering ? (
          <StickyActionBar row>
            <Button title="Cancel" variant="outline" fullWidth={false} style={styles.footSecondary} onPress={order.cancel} />
            <Button
              title="Save order"
              variant="premium"
              loading={order.saving}
              fullWidth={false}
              style={styles.footPrimary}
              onPress={() => void order.save()}
            />
          </StickyActionBar>
        ) : undefined
      }
    >
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={header}
        refreshControl={
          order.reordering ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
          )
        }
        contentContainerStyle={[
          members.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list,
          order.reordering && { paddingBottom: ADMIN_STICKY_FOOTER_PAD },
        ]}
        ListEmptyComponent={
          <EmptyState
            title="No team members yet"
            message="Add the people customers meet — they appear on the Team page"
            actionLabel="Add team member"
            onAction={() => open()}
          />
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <WebsiteListCard
              photoUrl={item.photo?.url}
              photoShape="round"
              title={item.name}
              subtitle={item.role || undefined}
              badge={item.active ? { label: 'SHOWN', tone: 'live' } : { label: 'HIDDEN', tone: 'off' }}
              meta={item.years ? `${item.years} yrs experience` : undefined}
              dimmed={!item.active}
              onPress={() => open(item.id)}
              reorder={order.reordering ? { index, count: members.length, onMove: order.onMove } : undefined}
            />
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: { marginBottom: spacing.xs, gap: spacing.sm },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary, marginBottom: spacing.xs },
  reorderBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  reorderText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },
  pressed: { opacity: 0.75 },
  footSecondary: { flex: 1 },
  footPrimary: { flex: 1.6 },
});
