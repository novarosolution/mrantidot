import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminLightHeader } from '@/components/kit/AdminLightHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { GlassPanel, GlassScreen } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes, authRoutes, appPush, appReplace } from '@/lib/routes';
import { colors, fonts, premiumType, spacing } from '@/constants/theme';

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
      haptic('error');
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
      haptic('success');
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (err) {
      haptic('error');
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
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <AdminSectionTitle flush title="Your account" hint="Signed-in admin profile" />
      </FadeSlideIn>
      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        <GlassPanel padded={false}>
          <View style={styles.accountWrap}>
            <UserAccountCard compact embedded />
          </View>
        </GlassPanel>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(2)} slideFrom={14}>
        <GlassPanel>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <IconInput label="Name" value={name} onChangeText={setName} />
          <IconInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <IconInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <IconInput label="City" value={city} onChangeText={setCity} />
          <IconInput
            label="New password"
            value={password}
            onChangeText={setPassword}
            secure
          />
          <Button title="Save" variant="premium" onPress={() => void saveProfile()} loading={saving} style={styles.btnGap} />
          {user?.id ? (
            <Button
              title="Advanced settings"
              variant="secondary"
              onPress={() =>
                appPush({
                  pathname: adminRoutes.userEdit,
                  params: { id: user.id, returnTo: adminRoutes.settings },
                })
              }
              style={styles.btnGap}
            />
          ) : null}
        </GlassPanel>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(3)} slideFrom={14}>
        <PressableScale
          onPress={() => appPush(adminRoutes.dataExport)}
          accessibilityRole="button"
          accessibilityLabel="Download all data"
        >
          <GlassPanel padded={false}>
            <View style={styles.logoutCard}>
              <PremiumIcon
                icon={AppIcons.ui.download}
                variant="soft"
                size="md"
                color={colors.forest}
                bg={colors.soft}
                boxSize={40}
              />
              <View style={styles.exportCopy}>
                <Text style={styles.exportTitle} numberOfLines={1}>
                  Download all data
                </Text>
                <Text style={styles.exportHint} numberOfLines={1}>
                  CSV & JSON backup of the business
                </Text>
              </View>
              <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="sm" color={colors.forest} />
            </View>
          </GlassPanel>
        </PressableScale>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(4)} slideFrom={14}>
        <PressableScale
          onPress={async () => {
            await logout();
            appReplace(authRoutes.login);
          }}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <GlassPanel padded={false}>
            <View style={styles.logoutCard}>
              <PremiumIcon
                icon={AppIcons.ui.logout}
                variant="soft"
                size="md"
                color={colors.error}
                bg={colors.errorBg}
                boxSize={40}
              />
              <Text style={styles.logoutTitle}>Sign out</Text>
            </View>
          </GlassPanel>
        </PressableScale>
      </FadeSlideIn>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  accountWrap: { padding: spacing.md },
  sectionTitle: { ...premiumType.sectionTitle, fontSize: 16, marginBottom: spacing.sm },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
  },
  btnGap: { marginTop: spacing.sm },
  logoutTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.error },
  exportCopy: { flex: 1, minWidth: 0 },
  exportTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  exportHint: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
