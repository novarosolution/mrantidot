import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import {
  TechnicianProfilePanel,
  checkInTechnician,
  loadTechnicianProfileData,
  markTechnicianAbsent,
} from '@/components/kit/TechnicianProfilePanel';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage, safeAsync } from '@/lib/api';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { design } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export default function TechProfileScreen() {
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendance, setAttendance] = useState<Record<string, DayAttendanceStatus>>({});
  const [calendar, setCalendar] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const data = await loadTechnicianProfileData(month);
    setStats(data.stats);
    setBookings(data.bookings);
    setAttendance(data.attendance);
    setTodayStatus(data.todayStatus);
    setCalendar(data.calendar);
  }, [month]);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load profile'));
      } finally {
        setLoading(false);
      }
    });
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <Spinner fullScreen />;

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="My profile" showBack />
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader
        variant="premium"
        title="My profile"
        subtitle="Stats, earnings & schedule"
        showBack
      />
      <TechnicianProfilePanel
        stats={stats}
        bookings={bookings}
        attendance={attendance}
        calendar={calendar}
        month={month}
        todayStatus={todayStatus}
        checkingIn={checkingIn}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        onMonthChange={setMonth}
        onCheckIn={() =>
          void safeAsync(async () => {
            setCheckingIn(true);
            try {
              await checkInTechnician();
              await load();
            } finally {
              setCheckingIn(false);
            }
          })
        }
        onMarkAbsent={() =>
          void safeAsync(async () => {
            setCheckingIn(true);
            try {
              await markTechnicianAbsent();
              await load();
            } finally {
              setCheckingIn(false);
            }
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
});
