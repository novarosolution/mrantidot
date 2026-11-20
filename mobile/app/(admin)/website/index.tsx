import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  GalleryHorizontal,
  Globe,
  Images,
  Inbox,
  LayoutList,
  ListChecks,
  MailOpen,
  Megaphone,
  Newspaper,
  Quote,
  Search,
  Type,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { AdminHubGroup, AdminHubLink } from '@/components/kit/AdminHubLink';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminStatStrip } from '@/components/kit/AdminPageKit';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { stagger } from '@/lib/motion';
import { adminRoutes, appPush, type RouteInput } from '@/lib/routes';
import { useWebsiteSummary } from '@/lib/useWebsiteSummary';
import type { WebsiteSummary } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type HubLink = {
  icon: LucideIcon;
  label: string;
  desc: (s: WebsiteSummary | null) => string;
  href: RouteInput;
  badge?: (s: WebsiteSummary | null) => number | undefined;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const GROUPS: { title: string; hint: string; links: HubLink[] }[] = [
  {
    title: 'Pages & look',
    hint: 'What each page shows and in which order',
    links: [
      { icon: LayoutList, label: 'Pages & sections', desc: () => 'Show, hide and reorder page blocks', href: adminRoutes.websitePages },
      { icon: Images, label: 'Photos', desc: () => 'Hero, about, why-us and share photos', href: adminRoutes.websitePhotos },
      { icon: ListChecks, label: 'Lists', desc: () => 'Stats, reasons, steps, sectors and more', href: adminRoutes.websiteLists },
      {
        icon: Type,
        label: 'Website text',
        desc: () => 'Headlines, buttons and labels',
        href: { pathname: adminRoutes.content, params: { tab: 'website' } },
      },
    ],
  },
  {
    title: 'Settings',
    hint: 'Links, Google results and the top bar',
    links: [
      {
        icon: Globe,
        label: 'Social links',
        desc: () => 'Facebook, Instagram, YouTube, LinkedIn, X',
        href: { pathname: adminRoutes.websiteSettings, params: { focus: 'social' } },
      },
      {
        icon: Search,
        label: 'SEO',
        desc: () => 'Search titles and descriptions per page',
        href: { pathname: adminRoutes.websiteSettings, params: { focus: 'seo' } },
      },
      {
        icon: Megaphone,
        label: 'Announcement bar',
        desc: () => 'Offer, custom message or off',
        href: { pathname: adminRoutes.websiteSettings, params: { focus: 'announcement' } },
      },
    ],
  },
  {
    title: 'Content',
    hint: 'Articles, photos and people',
    links: [
      {
        icon: Newspaper,
        label: 'Blog',
        desc: (s) => (s ? `${plural(s.posts, 'post')} live · ${plural(s.drafts, 'draft')}` : 'Articles and drafts'),
        href: adminRoutes.websiteBlog,
      },
      {
        icon: GalleryHorizontal,
        label: 'Gallery',
        desc: (s) => (s ? plural(s.gallery, 'photo') : 'Work photos'),
        href: adminRoutes.websiteGallery,
      },
      {
        icon: Users,
        label: 'Team',
        desc: (s) => (s ? plural(s.team, 'person', 'people') : 'People on the website'),
        href: adminRoutes.websiteTeam,
      },
      {
        icon: Quote,
        label: 'Testimonials',
        desc: (s) => (s ? plural(s.testimonials, 'quote') : 'Client quotes'),
        href: adminRoutes.websiteTestimonials,
      },
    ],
  },
  {
    title: 'Inbox',
    hint: 'Contact form and newsletter',
    links: [
      {
        icon: Inbox,
        label: 'Messages',
        desc: (s) => (s ? (s.newMessages > 0 ? `${s.newMessages} new to answer` : 'All caught up') : 'Contact form messages'),
        href: adminRoutes.websiteMessages,
        badge: (s) => s?.newMessages,
      },
      {
        icon: MailOpen,
        label: 'Subscribers',
        desc: (s) => (s ? `${plural(s.subscribers, 'active subscriber')}` : 'Newsletter emails'),
        href: adminRoutes.websiteSubscribers,
      },
    ],
  },
];

export default function WebsiteHubScreen() {
  // Always refetch on focus so the badge drops right after reading messages.
  const { summary, refresh } = useWebsiteSummary(0);
  const [refreshing, setRefreshing] = useState(false);
  const newMessages = summary?.newMessages ?? 0;
  const dash = (n: number | undefined) => (summary ? String(n ?? 0) : '–');

  return (
    <AdminListShell title="Website" subtitle="Everything on the public website">
      <ScrollView
        contentContainerStyle={[adminListShellStyles.form, styles.content]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.green}
            onRefresh={() => {
              setRefreshing(true);
              void refresh().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <View style={styles.gutter}>
            <AdminStatStrip
              flush
              items={[
                { label: 'New messages', value: dash(summary?.newMessages), color: newMessages > 0 ? colors.error : undefined },
                { label: 'Live posts', value: dash(summary?.posts) },
                { label: 'Drafts', value: dash(summary?.drafts), color: colors.amberInk },
                { label: 'Subscribers', value: dash(summary?.subscribers), color: colors.forest },
              ]}
            />
          </View>
        </FadeSlideIn>

        {newMessages > 0 ? (
          <FadeSlideIn delay={stagger(1)} slideFrom={14}>
            <PressableScale
              containerStyle={styles.gutter}
              style={styles.alert}
              onPress={() => appPush({ pathname: adminRoutes.websiteMessages, params: { status: 'new' } })}
              accessibilityRole="button"
              accessibilityLabel={`${newMessages} new website messages. Open inbox`}
              haptic="tap"
            >
              <View style={styles.alertIcon}>
                <Inbox size={18} color={colors.white} strokeWidth={2.2} />
              </View>
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>
                  {newMessages === 1 ? '1 new message' : `${newMessages} new messages`}
                </Text>
                <Text style={styles.alertSub}>People are waiting for a reply</Text>
              </View>
              <Text style={styles.alertCta}>Open</Text>
            </PressableScale>
          </FadeSlideIn>
        ) : null}

        {GROUPS.map((group, i) => (
          <FadeSlideIn key={group.title} delay={stagger(i + 2)} slideFrom={14}>
            <AdminSectionTitle title={group.title} hint={group.hint} />
            <AdminHubGroup>
              {group.links.map((l) => (
                <AdminHubLink
                  key={l.label}
                  icon={l.icon}
                  label={l.label}
                  desc={l.desc(summary)}
                  badge={l.badge?.(summary)}
                  onPress={() => appPush(l.href)}
                />
              ))}
            </AdminHubGroup>
          </FadeSlideIn>
        ))}
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  gutter: { paddingHorizontal: spacing.md },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.sm,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(179,63,40,0.16)',
  },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: { flex: 1, minWidth: 0 },
  alertTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  alertSub: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 1 },
  alertCta: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.error },
});
