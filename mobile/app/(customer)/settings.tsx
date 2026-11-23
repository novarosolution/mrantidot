import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { IconInput } from '@/components/kit/IconInput';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { GlassPanel, GlassScreen, GlassSectionLabel, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { isRealCity } from '@/lib/location';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { displayUserEmail, isProfileIncomplete } from '@/lib/profile-display';
import { radii, spacing, typeScale, ui as themeUi } from '@/constants/theme';
import { haptic } from '@/lib/motion';

type Field = 'name' | 'email' | 'phone';

export default function SettingsScreen() {
  const ui = useCustomerUiCopy();
  const { user, refreshMe } = useAuth();
  const { locating, detectAddress } = useLocation();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  /** Inline field errors — shown after the first save attempt, cleared as the customer types. */
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

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
      appToast.success(ui.settingsLocationUpdated, loc!.area ? `${loc!.area}, ${loc!.city}` : loc!.city);
    }
  }

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (!name.trim()) next.name = ui.settingsNameRequired;
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) next.email = ui.settingsEmailInvalid;
    const digits = phone.replace(/\D/g, '');
    if (phone.trim() && (digits.length < 10 || digits.length > 12)) next.phone = ui.settingsPhoneInvalid;
    return next;
  }

  async function save() {
    if (loading) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      haptic('warning');
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
      haptic('success');
      appToast.success(ui.settingsSaved);
    } catch {
      // toast from interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassScreen
      // Clear the docked tab bar so "Save changes" can scroll fully into view.
      contentContainerStyle={styles.scrollPad}
      header={
        <CustomerPageHeader
          variant="premium"
          title={ui.settingsScreenTitle}
          subtitle={ui.settingsSubtitle}
          showBack={!isProfileIncomplete(user)}
        />
      }
    >
      {/* The profile tab already shows who you are; here the only extra is a nudge to finish setup. */}
      {isProfileIncomplete(user) ? (
        <View style={styles.callout}>
          <AppIcons.ui.info size={18} color={themeUi.brand} strokeWidth={2.2} />
          <Text style={styles.calloutText}>{ui.settingsCompleteHint}</Text>
        </View>
      ) : null}
      <GlassSectionLabel title={ui.settingsDetailsTitle} hint={ui.settingsDetailsHint} />
      <GlassPanel>
        <IconInput
          label={ui.settingsFieldName}
          value={name}
          error={errors.name}
          onChangeText={(v) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          leftIcon={<PremiumIcon icon={AppIcons.ui.user} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label={ui.settingsFieldEmail}
          value={email}
          error={errors.email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<PremiumIcon icon={AppIcons.ui.mail} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label={ui.settingsFieldPhone}
          value={phone}
          error={errors.phone}
          onChangeText={(v) => {
            setPhone(v);
            if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
          }}
          keyboardType="phone-pad"
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <IconInput
          label={ui.settingsFieldCity}
          value={city}
          onChangeText={setCity}
          leftIcon={<PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="md" color={themeUi.textTertiary} />}
        />
        <AddressLocateButton loading={locating} onPress={() => void detectCity()} />
      </GlassPanel>

      <View style={styles.btnWrap}>
        <Button title={ui.settingsSave} variant="premium" onPress={save} loading={loading} />
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  scrollPad: { paddingBottom: TAB_BAR_SCROLL_PAD },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: themeUi.brandSoft,
  },
  calloutText: { ...typeScale.caption, flex: 1, lineHeight: 19, color: themeUi.text },
  btnWrap: { marginTop: spacing.xs },
});
