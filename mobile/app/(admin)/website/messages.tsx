import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CheckCheck, Mail, MailOpen, MessageCircle, Phone, Trash2, type LucideIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { WebsiteBadge } from '@/components/kit/WebsiteListCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { callPhone, openWhatsApp } from '@/lib/contact';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminRoutes } from '@/lib/routes';
import { formatTimeAgo } from '@/lib/time-ago';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { ContactMessage, ContactMessageStatus } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

type Filter = ContactMessageStatus | 'all';

const STATUS_BADGE: Record<ContactMessageStatus, { label: string; tone: 'new' | 'off' | 'live' }> = {
  new: { label: 'NEW', tone: 'new' },
  read: { label: 'READ', tone: 'off' },
  replied: { label: 'REPLIED', tone: 'live' },
};

function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/* ---------- card ---------- */

const MessageCard = memo(function MessageCard({
  message,
  onPress,
}: {
  message: ContactMessage;
  onPress: (m: ContactMessage) => void;
}) {
  const isNew = message.status === 'new';
  const badge = STATUS_BADGE[message.status];
  return (
    <PressableScale
      style={[styles.card, isNew && styles.cardNew]}
      containerStyle={styles.cardWrap}
      scaleTo={0.98}
      onPress={() => onPress(message)}
      accessibilityRole="button"
      accessibilityLabel={`${isNew ? 'New message' : 'Message'} from ${message.name}. ${message.message}`}
    >
      <View style={styles.cardHead}>
        <View style={[styles.avatar, isNew && styles.avatarNew]}>
          <Text style={[styles.avatarText, isNew && styles.avatarTextNew]}>{(message.name.trim()[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeadText}>
          <Text style={[styles.name, isNew && styles.nameNew]} numberOfLines={1}>
            {message.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {[message.service, message.phone || message.email].filter(Boolean).join(' · ') || 'Website contact form'}
          </Text>
        </View>
        <View style={styles.cardSide}>
          <Text style={styles.time}>{formatTimeAgo(message.createdAt)}</Text>
          <WebsiteBadge label={badge.label} tone={badge.tone} />
        </View>
      </View>
      <Text style={[styles.preview, isNew && styles.previewNew]} numberOfLines={2}>
        {message.message}
      </Text>
    </PressableScale>
  );
});

/* ---------- detail sheet ---------- */

function ContactButton({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <PressableScale
      containerStyle={styles.contactCell}
      style={styles.contactBtn}
      onPress={onPress}
      haptic="tap"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={18} color={colors.white} strokeWidth={2.2} />
      <Text style={styles.contactText}>{label}</Text>
    </PressableScale>
  );
}

function MessageSheet({
  message,
  onClose,
  onStatus,
  onDelete,
}: {
  message: ContactMessage | null;
  onClose: () => void;
  onStatus: (m: ContactMessage, status: ContactMessageStatus) => void;
  onDelete: (m: ContactMessage) => void;
}) {
  const m = message;
  const email = () => {
    if (!m?.email) return;
    const subject = encodeURIComponent(m.service ? `Re: ${m.service}` : 'Re: your message');
    void Linking.openURL(`mailto:${m.email}?subject=${subject}`).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not open your email app' }),
    );
  };

  return (
    <BottomSheet
      visible={m != null}
      onClose={onClose}
      title={m?.name ?? 'Message'}
      hint={m ? [m.service, fullDate(m.createdAt)].filter(Boolean).join(' · ') : undefined}
      footer={
        m ? (
          <View style={styles.sheetFoot}>
            <Pressable
              onPress={() => onDelete(m)}
              style={({ pressed }) => [styles.footBtn, styles.footDanger, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Delete message"
            >
              <Trash2 size={16} color={colors.error} strokeWidth={2.3} />
              <Text style={[styles.footText, styles.footTextDanger]}>Delete</Text>
            </Pressable>
            {m.status === 'replied' ? (
              <Pressable
                onPress={() => onStatus(m, 'new')}
                style={({ pressed }) => [styles.footBtn, styles.footGrow, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <MailOpen size={16} color={ui.brand} strokeWidth={2.3} />
                <Text style={styles.footText}>Mark as new</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => onStatus(m, 'replied')}
                style={({ pressed }) => [styles.footBtn, styles.footPrimary, styles.footGrow, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <CheckCheck size={16} color={colors.white} strokeWidth={2.3} />
                <Text style={[styles.footText, styles.footTextPrimary]}>Mark replied</Text>
              </Pressable>
            )}
          </View>
        ) : undefined
      }
    >
      {m ? (
        <>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText} selectable>
              {m.message}
            </Text>
          </View>
          <View style={styles.facts}>
            {m.phone ? (
              <Text style={styles.fact} selectable>
                <Text style={styles.factLabel}>Phone  </Text>
                {m.phone}
              </Text>
            ) : null}
            {m.email ? (
              <Text style={styles.fact} selectable>
                <Text style={styles.factLabel}>Email  </Text>
                {m.email}
              </Text>
            ) : null}
          </View>
          <View style={styles.contactRow}>
            {m.phone ? <ContactButton icon={Phone} label="Call" onPress={() => callPhone(m.phone)} /> : null}
            {m.phone ? <ContactButton icon={MessageCircle} label="WhatsApp" onPress={() => openWhatsApp(m.phone)} /> : null}
            {m.email ? <ContactButton icon={Mail} label="Email" onPress={email} /> : null}
          </View>
          <Text style={styles.sheetNote}>After you answer, tap “Mark replied” so the team knows it is done.</Text>
        </>
      ) : null}
    </BottomSheet>
  );
}

/* ---------- screen ---------- */

export default function WebsiteMessagesScreen() {
  const initial = paramString(useLocalSearchParams<{ status?: string | string[] }>().status);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<Filter>(
    initial === 'read' || initial === 'replied' || initial === 'all' ? initial : 'new',
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  // One request for every status keeps the chip counts honest.
  const load = useCallback(async () => {
    const { data } = await api.get<{ messages: ContactMessage[] }>('/website/admin/messages', { ...screenLoadConfig, skipCache: true });
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load messages');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 30_000);

  const counts = useMemo(() => {
    const c = { new: 0, read: 0, replied: 0 };
    for (const m of messages) c[m.status] += 1;
    return c;
  }, [messages]);

  const visible = useMemo(() => (filter === 'all' ? messages : messages.filter((m) => m.status === filter)), [messages, filter]);
  const open = openId ? messages.find((m) => m.id === openId) ?? null : null;

  const setStatus = useCallback(async (m: ContactMessage, status: ContactMessageStatus, quiet = false) => {
    const prevStatus = m.status;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
    try {
      await api.patch(`/website/admin/messages/${m.id}`, { status }, { skipErrorToast: true });
      if (!quiet) {
        haptic('success');
        Toast.show({ type: 'success', text1: status === 'replied' ? 'Marked as replied' : status === 'new' ? 'Marked as new' : 'Marked as read' });
      }
    } catch (err) {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: prevStatus } : x)));
      if (!quiet) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update the message') });
      }
    }
  }, []);

  const onPress = useCallback(
    (m: ContactMessage) => {
      haptic('tap');
      setOpenId(m.id);
      // Opening a new message marks it read.
      if (m.status === 'new') void setStatus(m, 'read', true);
    },
    [setStatus],
  );

  const onDelete = useCallback((m: ContactMessage) => {
    void confirmAsync({
      title: 'Delete this message?',
      message: `The message from ${m.name} will be removed for good.`,
      confirmLabel: 'Delete',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      try {
        await api.delete(`/website/admin/messages/${m.id}`, { skipErrorToast: true });
        haptic('success');
        setOpenId(null);
        setMessages((prev) => prev.filter((x) => x.id !== m.id));
        Toast.show({ type: 'success', text1: 'Message deleted' });
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the message') });
      }
    });
  }, []);

  const header = useMemo(
    () => (
      <FadeSlideIn slideFrom={14}>
        <View style={styles.chipsWrap}>
          <AdminFilterChips
            inset
            chips={[
              { key: 'new', label: `New (${counts.new})` },
              { key: 'read', label: `Read (${counts.read})` },
              { key: 'replied', label: `Replied (${counts.replied})` },
              { key: 'all', label: `All (${messages.length})` },
            ]}
            selected={filter}
            onSelect={(k) => setFilter(k as Filter)}
          />
        </View>
      </FadeSlideIn>
    ),
    [counts, filter, messages.length],
  );

  if (loading) {
    return (
      <AdminListShell title="Messages" subtitle="Website contact form" backFallback={adminRoutes.website}>
        <AdminListSkeleton variant="notification" chips rows={6} />
      </AdminListShell>
    );
  }

  if (error && messages.length === 0) {
    return (
      <AdminListShell title="Messages" subtitle="Could not load" backFallback={adminRoutes.website}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Messages"
      subtitle={counts.new > 0 ? `${counts.new} new · website contact form` : 'All caught up · website contact form'}
      backFallback={adminRoutes.website}
    >
      <FlatList
        data={visible}
        keyExtractor={(m) => m.id}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'new' ? 'No new messages' : filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
            message={
              filter === 'new' ? 'You are all caught up. New contact form messages land here.' : 'Messages from the website contact form appear here.'
            }
          />
        }
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <MessageCard message={item} onPress={onPress} />
          </AdminEntrance>
        )}
      />
      <MessageSheet
        message={open}
        onClose={() => setOpenId(null)}
        onStatus={(m, status) => void setStatus(m, status)}
        onDelete={onDelete}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  chipsWrap: { marginHorizontal: -spacing.md, marginBottom: spacing.xs },
  cardWrap: { marginBottom: spacing.sm },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 10,
    ...ui.shadow,
  },
  cardNew: { borderColor: 'rgba(179,63,40,0.22)' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNew: { backgroundColor: ui.brand },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.textSecondary },
  avatarTextNew: { color: colors.white },
  cardHeadText: { flex: 1, minWidth: 0 },
  name: { ...adminType.listTitle, fontSize: 14.5, color: ui.text },
  nameNew: { fontFamily: fonts.bodyBold },
  sub: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
  cardSide: { alignItems: 'flex-end', gap: 5 },
  time: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  preview: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  previewNew: { color: ui.text },
  bubble: { padding: 14, borderRadius: 16, backgroundColor: ui.surfaceMuted, marginBottom: spacing.md },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: ui.text },
  facts: { gap: 6, marginBottom: spacing.md },
  fact: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  factLabel: { fontFamily: fonts.body, color: ui.textSecondary },
  contactRow: { flexDirection: 'row', gap: 8 },
  contactCell: { flex: 1 },
  contactBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  contactText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white },
  sheetNote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginTop: spacing.md },
  sheetFoot: { flexDirection: 'row', gap: 10 },
  footBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  footGrow: { flex: 1 },
  footPrimary: { backgroundColor: ui.brand, borderColor: ui.brand },
  footDanger: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.18)' },
  footText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  footTextPrimary: { color: colors.white },
  footTextDanger: { color: colors.error },
  pressed: { opacity: 0.8 },
});
