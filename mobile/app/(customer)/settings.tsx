import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { GlassPanel, GlassScreen, GlassSectionLabel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { isRealCity } from '@/lib/location';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { displayUserEmail, isProfileIncomplete } from '@/lib/profile-display';
import { fonts, spacing, ui as themeUi } from '@/constants/theme';

export default function SettingsScreen() {
  const ui = useCustomerUiCopy();
  const { user, refreshMe } = useAuth();
  const { locating, detectAddress } = useLocation();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const syncFromUser = useCallback(() => {
    if (!user) return;
    setName(user.name?.trim() && user.name.toLowerCase() !== 'customer' ? user.name : '');
    setEmail(displayUserEmail(user.email) ?? '');
    setCity(user.city ?? '');
    setPhone(user.phone ?? '');
  }, [user]);

  useEffect(() => {
    syncFromUser();
  }, [syncFromUser]);

  useFocusEffect(
    useCallback(() => {
      void refreshMe({ silent: true });
    }, [refreshMe]),
  );

  async function detectCity() {
    const loc = await detectAddress();
    if (isRealCity(loc?.city)) {
      setCity(loc!.city);
      appToast.success('Location updated', loc!.area ? `${loc!.area}, ${loc!.city}` : loc!.city);
    }
  }

  async function save() {
    if (loading) return;
    if (!name.trim()) {
      appToast.error('Please enter your name');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      appToast.error('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await api.patch('/auth/me', {
        name: name.trim(),
        city: city.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      await refreshMe();
      appToast.success('Profile updated');
    } catch {
      // toast from interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassScreen
      header={
        <CustomerPageHeader
          variant="premium"
          title={ui.settingsScreenTitle}
          subtitle="Your account & preferences"
          showBack={!isProfileIncomplete(user)}
        />
      }
    >
      <GlassPanel padded={false}>
        <View style={styles.accountWrap}>
          <UserAccountCard compact embedded />
          {isProfileIncomplete(user) ? (
            <Text style={styles.completeHint}>Complete your profile below for a smoother booking experience.</Text>
          ) : null}
        </View>
      </GlassPanel>
      <GlassSectionLabel title="Profile details" hint="Update your contact information" />
      <GlassPanel>
        <IconInput
          label="Full name"
          value={name}
          onChangeText={setName}
          leftIcon={<PremiumIcon icon={AppIcons.ui.user} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<PremiumIcon icon={AppIcons.ui.mail} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label="City"
          value={city}
          onChangeText={setCity}
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <AddressLocateButton loading={locating} onPress={() => void detectCity()} />
      </GlassPanel>

      <View style={styles.btnWrap}>
        <Button title="Save changes" variant="premium" onPress={save} loading={loading} />
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  accountWrap: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  completeHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: themeUi.brand,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
  btnWrap: { marginTop: spacing.xs },
});
