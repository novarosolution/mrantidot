import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { LogOut } from 'lucide-react-native';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { colors, design, fonts, spacing } from '@/constants/theme';

export default function AdminSettingsScreen() {
  const { user, logout, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    if (!user?.id) return;
    if (!name.trim() || !email.trim()) {
      Toast.show({ type: 'error', text1: 'Name and email are required' });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
      };
      if (phone.trim()) body.phone = phone.trim();
      await api.patch(`/admin/users/${user.id}`, body);
      if (password.length >= 8) {
        await api.patch(`/admin/users/${user.id}/password`, { password });
      }
      await refreshMe({ silent: true });
      setPassword('');
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update profile') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminListShell title="Profile" subtitle="Admin account" keyboardAvoid>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
        <UserAccountCard compact />
        <Card variant="premium" style={styles.card}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <IconInput label="Name" value={name} onChangeText={setName} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <IconInput label="City" value={city} onChangeText={setCity} />
          <IconInput label="New password (optional)" value={password} onChangeText={setPassword} secure />
          <Button title="Save changes" variant="premium" onPress={() => void saveProfile()} loading={saving} style={{ marginTop: spacing.sm }} />
          {user?.id ? (
            <Button
              title="Advanced user settings"
              variant="secondary"
              onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: user.id } })}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Card>
        <Card variant="premium" style={styles.logoutCard} onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}>
          <LogOut size={19} color={colors.error} />
          <View style={styles.flex}>
            <Text style={styles.logoutTitle}>Sign out</Text>
            <Text style={styles.logoutHint}>You will return to the login screen</Text>
          </View>
        </Card>
        <Text style={styles.envHint}>
          Primary admin login can also be set in server/.env (ADMIN_PHONE, ADMIN_EMAIL, ADMIN_PASSWORD).
        </Text>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...design.sectionTitle, marginBottom: spacing.sm },
  flex: { flex: 1 },
  logoutCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md },
  logoutTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.error },
  logoutHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  envHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
