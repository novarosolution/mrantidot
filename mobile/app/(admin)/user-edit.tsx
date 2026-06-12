import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { safeGoBack } from '@/lib/routes';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminFormCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { IconInput } from '@/components/kit/IconInput';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { technicianRealRating } from '@/lib/ratings';
import { paramString } from '@/lib/routeParams';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { User, UserRole } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'technician', label: 'Technician' },
  { key: 'admin', label: 'Admin' },
];

function parseInitialRole(raw: string | string[] | undefined): UserRole {
  const v = paramString(raw);
  if (v === 'technician' || v === 'admin') return v;
  return 'customer';
}

export default function UserEditScreen() {
  const { user: me, refreshMe } = useAuth();
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const initialRole = parseInitialRole(useLocalSearchParams<{ role?: string | string[] }>().role);

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [available, setAvailable] = useState(true);
  const [active, setActive] = useState(true);
  const [displayRating, setDisplayRating] = useState('');
  const [realTechRating, setRealTechRating] = useState<number | null>(null);
  const [protectedAccount, setProtectedAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ user: User }>(`/admin/users/${id}`, screenLoadConfig);
    const u = data.user;
    setRole(u.role);
    setName(u.name);
    setPhone(u.phone ?? '');
    setEmail(u.email);
    setCity(u.city ?? '');
    setAvailable(u.available !== false);
    setActive(u.disabled !== true);
    setDisplayRating(u.displayRating != null && u.displayRating > 0 ? String(u.displayRating) : '');
    setRealTechRating(u.role === 'technician' ? technicianRealRating(u) : null);
    setProtectedAccount(u.protected === true);
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load, 'Could not load user');
  }, [id, load, runLoad]);

  const roleLocked = protectedAccount;

  async function save() {
    if (!name.trim() || !email.trim()) {
      Toast.show({ type: 'error', text1: 'Name and email are required' });
      return;
    }
    if (!phone.trim()) {
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
        const body: Record<string, string | boolean | number | null> = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          disabled: !active,
        };
        if (!roleLocked) body.role = role;
        if (role === 'technician') {
          body.available = available;
          if (displayRating.trim()) {
            const dr = parseFloat(displayRating);
            if (Number.isNaN(dr) || dr < 0 || dr > 5) {
              Toast.show({ type: 'error', text1: 'Public rating must be between 0 and 5' });
              setSaving(false);
              return;
            }
            body.displayRating = dr;
          } else {
            body.displayRating = null;
          }
        }
        else if (active) body.available = true;
        await api.patch(`/admin/users/${id}`, body);
        if (password.length >= 8) {
          await api.patch(`/admin/users/${id}/password`, { password });
        }
        if (id === me?.id) await refreshMe({ silent: true });
      } else {
        await api.post('/admin/users', {
          role,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          password,
        });
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      safeGoBack('/(admin)/users');
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save user') });
    } finally {
      setSaving(false);
    }
  }

  function disableAccount() {
    if (!id || roleLocked) return;
    Alert.alert('Disable account?', 'They will not be able to sign in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/admin/users/${id}`);
              Toast.show({ type: 'success', text1: 'Account disabled' });
              safeGoBack('/(admin)/users');
            } catch (err) {
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not disable account') });
            }
          })();
        },
      },
    ]);
  }

  const title = id ? 'Edit user' : `Add ${role}`;
  const subtitle = id ? `Role: ${role}` : 'New account';

  if (id && loading) return <Spinner fullScreen />;

  if (id && error) {
    return (
      <AdminListShell title="User" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title={title}
      subtitle={subtitle}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar>
          <Button title="Save" variant="premium" onPress={() => void save()} loading={saving} />
          {id && active && !roleLocked ? (
            <Button title="Disable account" variant="danger" onPress={disableAccount} style={{ marginTop: spacing.sm }} />
          ) : null}
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={id && active && !roleLocked ? adminListShellStyles.scrollWithFooterTall : adminListShellStyles.scrollWithFooter}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <AdminFormCard>
          <Text style={styles.label}>Role</Text>
          <AdminFilterChips
            chips={ROLES.map((r) => ({ key: r.key, label: r.label }))}
            selected={role}
            onSelect={(key) => {
              if (!roleLocked) setRole(key as UserRole);
            }}
          />

          <IconInput label="Name" value={name} onChangeText={setName} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <IconInput label="City" value={city} onChangeText={setCity} />
          <IconInput
            label={id ? 'New password (optional)' : 'Password'}
            value={password}
            onChangeText={setPassword}
            secure
          />

          {id && role === 'technician' ? (
            <>
              <IconInput
                label="Public rating"
                value={displayRating}
                onChangeText={setDisplayRating}
                keyboardType="decimal-pad"
                placeholder="Empty = real average"
              />
              {realTechRating != null ? (
                <Text style={styles.hint}>Real avg: ★ {realTechRating.toFixed(1)}</Text>
              ) : null}
              <View style={styles.toggleRow}>
                <View style={styles.flex}>
                  <Text style={styles.toggleLabel}>On duty</Text>
                </View>
                <ToggleSwitch value={available} onToggle={() => setAvailable((v) => !v)} />
              </View>
            </>
          ) : null}

          {id ? (
            <View style={styles.toggleRow}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Account active</Text>
              </View>
              <ToggleSwitch value={active} onToggle={() => !roleLocked && setActive((v) => !v)} />
            </View>
          ) : null}
        </AdminFormCard>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: 8 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 12 },
  flex: { flex: 1 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  toggleHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});
