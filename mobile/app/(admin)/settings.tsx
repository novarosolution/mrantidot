import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { LogOut } from 'lucide-react-native';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminFormCard } from '@/components/kit/AdminPageKit';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { colors, design, fonts, premium, shadows, spacing } from '@/constants/theme';

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
        <AdminFormCard style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <IconInput label="Name" value={name} onChangeText={setName} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <IconInput label="City" value={city} onChangeText={setCity} />
          <IconInput label="New password" value={password} onChangeText={setPassword} secure />
          <Button title="Save" variant="premium" onPress={() => void saveProfile()} loading={saving} style={{ marginTop: spacing.sm }} />
          {user?.id ? (
            <Button
              title="Advanced settings"
              variant="secondary"
              onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: user.id } })}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </AdminFormCard>
        <Pressable
          style={({ pressed }) => [styles.logoutCard, pressed && styles.pressed]}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <View style={styles.logoutIcon}>
            <LogOut size={18} color={colors.error} />
          </View>
          <Text style={styles.logoutTitle}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  formCard: { marginTop: spacing.md },
  sectionTitle: { ...design.sectionTitle, marginBottom: spacing.sm },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
    ...shadows.card,
  },
  pressed: { opacity: 0.9 },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.error },
});
