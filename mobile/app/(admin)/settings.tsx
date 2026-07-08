import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminLightHeader } from '@/components/kit/AdminLightHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { GlassPanel, GlassScreen } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { adminRoutes } from '@/lib/routes';
import { colors, fonts, premium, premiumType, spacing, surfaces } from '@/constants/theme';

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
    <GlassScreen
      header={
        <AdminLightHeader
          title="Profile"
          subtitle="Admin account & security"
          showBack
          backFallback={adminRoutes.team}
        />
      }
    >
      <AdminSectionTitle title="Your account" hint="Signed-in admin profile" />
      <GlassPanel padded={false}>
        <View style={styles.accountWrap}>
          <UserAccountCard compact embedded />
        </View>
      </GlassPanel>

      <GlassPanel>
        <Text style={styles.sectionTitle}>Edit profile</Text>
        <IconInput label="Name" value={name} onChangeText={setName} containerStyle={styles.glassInput} />
        <IconInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerStyle={styles.glassInput}
        />
        <IconInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          containerStyle={styles.glassInput}
        />
        <IconInput label="City" value={city} onChangeText={setCity} containerStyle={styles.glassInput} />
        <IconInput
          label="New password"
          value={password}
          onChangeText={setPassword}
          secure
          containerStyle={styles.glassInput}
        />
        <Button title="Save" variant="premium" onPress={() => void saveProfile()} loading={saving} style={{ marginTop: spacing.sm }} />
        {user?.id ? (
          <Button
            title="Advanced settings"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: adminRoutes.userEdit,
                params: { id: user.id, returnTo: adminRoutes.settings },
              })
            }
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </GlassPanel>

      <GlassPanel padded={false}>
        <Pressable
          style={({ pressed }) => [styles.logoutCard, pressed && styles.pressed]}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <PremiumIcon
            icon={AppIcons.ui.logout}
            variant="soft"
            size="md"
            color={colors.error}
            bg={colors.errorBg}
            boxSize={40}
          />
          <Text style={styles.logoutTitle}>Sign out</Text>
        </Pressable>
      </GlassPanel>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  accountWrap: { padding: spacing.md },
  sectionTitle: { ...premiumType.sectionTitle, fontSize: 16, marginBottom: spacing.sm },
  glassInput: {
    backgroundColor: surfaces.glassInput,
    borderColor: surfaces.glassBorderStrong,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9 },
  logoutTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.error },
});
