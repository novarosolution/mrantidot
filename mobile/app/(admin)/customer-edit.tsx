import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { paramString } from '@/lib/routeParams';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { colors, fonts, spacing } from '@/constants/theme';

export default function CustomerEditScreen() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const { loading, error, runLoad } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ user: { name: string; phone?: string; email: string; city?: string; available?: boolean; disabled?: boolean } }>(
      `/admin/users/${id}`,
      screenLoadConfig,
    );
    const u = data.user;
    setName(u.name);
    setPhone(u.phone ?? '');
    setEmail(u.email);
    setCity(u.city ?? '');
    setActive(u.disabled !== true);
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load, 'Could not load customer');
  }, [id, load, runLoad]);

  async function save() {
    if (!name.trim() || !email.trim()) {
      Toast.show({ type: 'error', text1: 'Name and email are required' });
      return;
    }
    if (!id && !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Phone is required' });
      return;
    }
    if (!id && password.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    try {
      if (id) {
        const body: Record<string, string | boolean> = {
          name: name.trim(),
          email: email.trim(),
          city: city.trim(),
          disabled: !active,
        };
        if (active) body.available = true;
        if (phone.trim()) body.phone = phone.trim();
        await api.patch(`/admin/users/${id}`, body);
        if (password.length >= 8) {
          await api.patch(`/admin/users/${id}/password`, { password });
        }
      } else {
        await api.post('/admin/users', {
          role: 'customer',
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          password,
        });
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save customer') });
    } finally {
      setSaving(false);
    }
  }

  function disableAccount() {
    if (!id) return;
    Alert.alert('Disable customer?', 'They will not be able to sign in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/admin/users/${id}`);
              Toast.show({ type: 'success', text1: 'Customer disabled' });
              router.back();
            } catch (err) {
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not disable customer') });
            }
          })();
        },
      },
    ]);
  }

  if (id && loading) return <Spinner fullScreen />;

  if (id && error) {
    return (
      <AdminListShell title="Customer" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void runLoad(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell title={id ? 'Edit Customer' : 'Add Customer'} subtitle="Customer account">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card variant="premium" style={styles.form}>
          <IconInput label="Name" value={name} onChangeText={setName} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <IconInput label="City" value={city} onChangeText={setCity} />
          <IconInput
            label={id ? 'New password (optional)' : 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {id ? (
            <View style={styles.toggleRow}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Account active</Text>
                <Text style={styles.toggleHint}>Disabled accounts cannot sign in</Text>
              </View>
              <ToggleSwitch value={active} onToggle={() => setActive((v) => !v)} />
            </View>
          ) : null}
        </Card>
      </ScrollView>
      <StickyActionBar>
        <Button title="Save" variant="premium" onPress={() => void save()} loading={saving} />
        {id && active ? (
          <Button title="Disable account" variant="danger" onPress={disableAccount} style={{ marginTop: spacing.sm }} />
        ) : null}
      </StickyActionBar>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 120 },
  form: { padding: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 12 },
  flex: { flex: 1 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  toggleHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});
