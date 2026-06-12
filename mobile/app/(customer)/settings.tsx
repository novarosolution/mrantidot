import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { appToast } from '@/lib/toast';
import { User, Mail, Phone, MapPin } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { AddressLocateButton } from '@/components/kit/AddressLocateButton';
import { LocationBanner } from '@/components/kit/LocationChip';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { displayUserEmail, displayUserName, isProfileIncomplete } from '@/lib/profile-display';
import { colors, design, fonts, spacing } from '@/constants/theme';

export default function SettingsScreen() {
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
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader variant="premium" title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <UserAccountCard compact />
        <Text style={styles.role}>Signed in as Customer · {displayUserName(user)}</Text>
        {isProfileIncomplete(user) ? (
          <Text style={styles.completeHint}>Complete your profile below.</Text>
        ) : null}
        {displayLabel ? (
          <LocationBanner
            label={displayLabel}
            loading={locating}
            onRefresh={() => void detectCity()}
          />
        ) : null}
        <Card variant="premium" style={styles.form}>
          <IconInput label="Full name" value={name} onChangeText={setName} leftIcon={<User size={18} color={colors.muted} />} />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={18} color={colors.muted} />} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon={<Phone size={18} color={colors.muted} />} />
          <IconInput label="City" value={city} onChangeText={setCity} leftIcon={<MapPin size={18} color={colors.muted} />} />
          <AddressLocateButton loading={locating} onPress={() => void detectCity()} />
        </Card>
        <View style={styles.btnWrap}>
          <Button title="Save changes" variant="premium" onPress={save} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  role: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.xs, textAlign: 'center' },
  completeHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.forest,
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
  form: { padding: spacing.md, gap: spacing.sm },
  btnWrap: { marginTop: spacing.md },
});
