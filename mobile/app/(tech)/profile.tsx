import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  TechnicianProfilePanel,
  loadTechnicianProfileData,
} from '@/components/kit/TechnicianProfilePanel';
import { TechScreen } from '@/components/kit/TechScreenKit';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage, safeAsync } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { useTechCopy } from '@/lib/tech-copy';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { authRoutes, appReplace } from '@/lib/routes';

export default function TechProfileScreen() {
  const copy = useTechCopy();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendance, setAttendance] = useState<Record<string, DayAttendanceStatus>>({});
  const [calendar, setCalendar] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(() => localDateKey().slice(0, 7));
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
  const [onDuty, setOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const data = await loadTechnicianProfileData(month);
    setStats(data.stats);
    setBookings(data.bookings);
    setAttendance(data.attendance);
    setTodayStatus(data.todayStatus);
    setOnDuty(data.onDuty);
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
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh profile'));
    } finally {
      setRefreshing(false);
    }
  }

  const confirmLogout = useCallback(() => {
    Alert.alert('Sign out?', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          appReplace(authRoutes.login);
        },
      },
    ]);
  }, [logout]);

  if (loading) return <Spinner fullScreen />;

  if (loadError) {
    return (
      <TechScreen>
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
      </TechScreen>
    );
  }

  return (
    <TechScreen>
      <TechnicianProfilePanel
        copy={copy}
        user={user}
        stats={stats}
        bookings={bookings}
        attendance={attendance}
        calendar={calendar}
        month={month}
        todayStatus={todayStatus}
        onDuty={onDuty}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        onMonthChange={setMonth}
        onLogout={confirmLogout}
      />
    </TechScreen>
  );
}
