import { useState } from 'react';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { TechnicianProfilePanel } from '@/components/kit/TechnicianProfilePanel';
import { TechScreen } from '@/components/kit/TechScreenKit';
import { TechConfirmSheet } from '@/components/tech/TechConfirmSheet';
import { TechInlineNotice } from '@/components/tech/TechInlineNotice';
import { TechProfileSkeleton } from '@/components/tech/TechSkeletons';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { useAuth } from '@/context/AuthContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { appReplace, authRoutes } from '@/lib/routes';
import { useTechCopy } from '@/lib/tech-copy';
import { clearTechData, techCurrentMonth, useTechAttendance, useTechJobs, useTechStats } from '@/lib/techData';

export default function TechProfileScreen() {
  const booking = useTechCopy();
  const copy = useCustomerUiCopy();
  const { user, logout } = useAuth();
  const currentMonth = techCurrentMonth();
  const [month, setMonth] = useState(currentMonth);
  const jobs = useTechJobs();
  const today = useTechAttendance(currentMonth);
  const calendar = useTechAttendance(month);
  const stats = useTechStats(currentMonth);
  const monthStats = useTechStats(month);
  const [pulling, setPulling] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onRefresh() {
    setPulling(true);
    try {
      await Promise.all([jobs.reload(true), today.reload(true), calendar.reload(true), stats.reload(true), monthStats.reload(true)]);
    } finally {
      setPulling(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
      clearTechData();
      appReplace(authRoutes.login);
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  }

  const header = (
    <PremiumAppHeader eyebrow={copy.techProfileEyebrow} title={booking.techProfileTitle} subtitle={copy.techProfileSubtitle} />
  );

  if (stats.loading) {
    return (
      <TechScreen header={header}>
        <TechProfileSkeleton />
      </TechScreen>
    );
  }

  if (!stats.data) {
    return (
      <TechScreen header={header}>
        <ListEmptyRetry
          title={copy.techProfileLoadError}
          message={stats.error ?? undefined}
          retryLabel={copy.techRetry}
          onRetry={() => void stats.refresh()}
        />
      </TechScreen>
    );
  }

  // Jobs, the calendar or the month's numbers failed while the profile loaded: say so above the calendar.
  const notice =
    jobs.error || calendar.error || monthStats.error ? (
      <TechInlineNotice
        message={copy.techRefreshError}
        actionLabel={copy.techRetry}
        busy={jobs.refreshing || calendar.refreshing || monthStats.refreshing}
        onAction={() => {
          void jobs.refresh();
          void calendar.refresh();
          void monthStats.refresh();
        }}
      />
    ) : null;

  return (
    <TechScreen>
      <TechnicianProfilePanel
        name={user?.name?.trim() || copy.techNameFallback}
        phone={user?.phone}
        city={user?.city}
        stats={stats.data}
        monthStats={monthStats.data ?? null}
        monthStatsLoading={monthStats.loading}
        bookings={jobs.data ?? []}
        attendance={calendar.data?.attendance ?? {}}
        month={month}
        todayStatus={today.data?.todayStatus ?? stats.data.todayStatus ?? 'pending'}
        onDuty={today.data?.onDuty ?? false}
        notice={notice}
        refreshing={pulling}
        onRefresh={() => void onRefresh()}
        onMonthChange={setMonth}
        onLogout={() => setSignOutOpen(true)}
      />
      <TechConfirmSheet
        visible={signOutOpen}
        title={copy.techSignOutTitle}
        message={copy.techSignOutText}
        confirmLabel={copy.techSignOut}
        cancelLabel={copy.techCancel}
        destructive
        loading={signingOut}
        onConfirm={() => void signOut()}
        onClose={() => setSignOutOpen(false)}
      />
    </TechScreen>
  );
}
