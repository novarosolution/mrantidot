import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { User, Mail, Phone, MapPin } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { UserAccountCard } from '@/components/kit/UserAccountCard';
import { IconInput } from '@/components/kit/IconInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { colors, design, fonts, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setCity(user.city ?? '');
    setPhone(user.phone ?? '');
  }, [user]);

  async function save() {
    setLoading(true);
    try {
      await api.patch('/auth/me', { name, email, city, phone });
      await refreshMe();
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch {
      // toast from interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader variant="premium" title="Settings" subtitle="Update your account details" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <UserAccountCard compact />
        <Text style={styles.role}>Signed in as Customer</Text>
        <Card variant="premium" style={styles.form}>
          <IconInput label="Full name" value={name} onChangeText={setName} leftIcon={<User size={18} color={colors.muted} />} />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={18} color={colors.muted} />} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon={<Phone size={18} color={colors.muted} />} />
          <IconInput label="City" value={city} onChangeText={setCity} leftIcon={<MapPin size={18} color={colors.muted} />} />
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
  role: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.md, textAlign: 'center' },
  form: { padding: spacing.md },
  btnWrap: { marginTop: spacing.md },
});
