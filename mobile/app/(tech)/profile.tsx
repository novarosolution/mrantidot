import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassBackdrop } from '@/components/kit/GlassScreenKit';
import {
  TechnicianProfilePanel,
  loadTechnicianProfileData,
} from '@/components/kit/TechnicianProfilePanel';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage, safeAsync } from '@/lib/api';
import { useTechCopy } from '@/lib/tech-copy';
import type { Booking, DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { surfaces } from '@/constants/theme';

export default function TechProfileScreen() {
  const copy = useTechCopy();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendance, setAttendance] = useState<Record<string, DayAttendanceStatus>>({});
  const [calendar, setCalendar] = useState<Record<string, number>>({});
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [todayStatus, setTodayStatus] = useState<DayAttendanceStatus>('pending');
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

  const confirmLogout = useCallback(() => {
    Alert.alert('Sign out?', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [logout]);

  if (loading) return <Spinner fullScreen />;

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <TechnicianProfilePanel
        copy={copy}
        user={user}
        stats={stats}
        bookings={bookings}
        attendance={attendance}
        calendar={calendar}
        month={month}
        todayStatus={todayStatus}
        refreshing={refreshing}
        onRefresh={() => void onRefresh()}
        onMonthChange={setMonth}
        onLogout={confirmLogout}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1 },
});
