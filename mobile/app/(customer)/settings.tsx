import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { LocationBanner } from '@/components/kit/LocationChip';
import { GlassPanel, GlassScreen, GlassSectionLabel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { displayUserEmail, displayUserName, isProfileIncomplete } from '@/lib/profile-display';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

export default function SettingsScreen() {
  const ui = useCustomerUiCopy();
  const { user, refreshMe } = useAuth();
  const { displayLabel, locating, detectAddress } = useLocation();
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
    if (loc?.city && loc.city !== 'your area') {
      setCity(loc.city);
      appToast.success('City updated from GPS');
    }
  }

  async function save() {
    setLoading(true);
    try {
      await api.patch('/auth/me', { name, email, city, phone });
      await refreshMe();
      appToast.success('Profile updated');
    } catch {
      // toast from interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassScreen header={<CustomerPageHeader variant="premium" title={ui.settingsScreenTitle} subtitle="Your account & preferences" showBack />}>
      <GlassPanel padded={false}>
        <View style={styles.accountWrap}>
          <UserAccountCard compact embedded />
          <Text style={styles.role}>Signed in as Customer · {displayUserName(user)}</Text>
          {isProfileIncomplete(user) ? (
            <Text style={styles.completeHint}>Complete your profile below for a smoother booking experience.</Text>
          ) : null}
        </View>
      </GlassPanel>

      {displayLabel ? (
        <GlassPanel>
          <LocationBanner
            label={displayLabel}
            loading={locating}
            onRefresh={() => void detectCity()}
            embedded
          />
        </GlassPanel>
      ) : null}

      <GlassSectionLabel title="Profile details" hint="Update your contact information" />
      <GlassPanel>
        <IconInput
          label="Full name"
          value={name}
          onChangeText={setName}
          leftIcon={<PremiumIcon icon={AppIcons.ui.user} variant="plain" size="md" color={colors.muted} />}
          containerStyle={styles.glassInput}
        />
        <IconInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<PremiumIcon icon={AppIcons.ui.mail} variant="plain" size="md" color={colors.muted} />}
          containerStyle={styles.glassInput}
        />
        <IconInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="md" color={colors.muted} />}
          containerStyle={styles.glassInput}
        />
        <IconInput
          label="City"
          value={city}
          onChangeText={setCity}
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="md" color={colors.muted} />}
          containerStyle={styles.glassInput}
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
  role: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
  completeHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.forest,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
  glassInput: {
    backgroundColor: surfaces.glassInput,
    borderColor: surfaces.glassBorderStrong,
  },
  btnWrap: { marginTop: spacing.xs },
});
