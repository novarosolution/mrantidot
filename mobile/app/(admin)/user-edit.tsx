import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { adminGoBack, adminRoutes } from '@/lib/routes';
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
  const returnTo = paramString(useLocalSearchParams<{ returnTo?: string | string[] }>().returnTo) || adminRoutes.users;

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
  const [payMode, setPayMode] = useState<'percent' | 'flat'>('percent');
  const [payPercent, setPayPercent] = useState('100');
  const [payFlat, setPayFlat] = useState('0');
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
    setPayMode(u.payMode === 'flat' ? 'flat' : 'percent');
    setPayPercent(u.payPercent != null ? String(u.payPercent) : '100');
    setPayFlat(u.payFlat != null ? String(u.payFlat) : '0');
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
          body.payMode = payMode;
          if (payMode === 'percent') {
            const pct = parseFloat(payPercent);
            if (Number.isNaN(pct) || pct < 0 || pct > 100) {
              Toast.show({ type: 'error', text1: 'Pay percent must be 0–100' });
              setSaving(false);
              return;
            }
            body.payPercent = pct;
          } else {
            const flat = parseFloat(payFlat);
            if (Number.isNaN(flat) || flat < 0) {
              Toast.show({ type: 'error', text1: 'Flat pay must be 0 or more' });
              setSaving(false);
              return;
            }
            body.payFlat = Math.round(flat);
          }
        }
        else if (active) body.available = true;
        await api.patch(`/admin/users/${id}`, body);
        if (password.length >= 8) {
          await api.patch(`/admin/users/${id}/password`, { password });
        }
        if (id === me?.id) await refreshMe({ silent: true });
      } else {
        const createBody: Record<string, string | number> = {
          role,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          password,
        };
        if (role === 'technician') {
          createBody.payMode = payMode;
          if (payMode === 'percent') {
            const pct = parseFloat(payPercent);
            createBody.payPercent = Number.isNaN(pct) ? 100 : Math.min(100, Math.max(0, pct));
          } else {
            const flat = parseFloat(payFlat);
            createBody.payFlat = Number.isNaN(flat) ? 0 : Math.max(0, Math.round(flat));
          }
        }
        await api.post('/admin/users', createBody);
      }
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(returnTo);
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
              adminGoBack(returnTo);
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
      backFallback={returnTo}
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
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionHint}>Who they are and how they sign in</Text>
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

          {id ? (
            <View style={styles.toggleRow}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Account active</Text>
              </View>
              <ToggleSwitch value={active} onToggle={() => !roleLocked && setActive((v) => !v)} />
            </View>
          ) : null}
        </AdminFormCard>

        {role === 'technician' ? (
          <AdminFormCard>
            <Text style={styles.sectionTitle}>Technician</Text>
            <Text style={styles.sectionHint}>Duty status and public rating</Text>
            {id ? (
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
            ) : (
              <Text style={styles.hint}>Save the account first, then set rating and duty.</Text>
            )}

            <Text style={[styles.sectionTitle, styles.payTitle]}>Technician pay</Text>
            <Text style={styles.sectionHint}>
              Take-home per completed job. Locked when the job is marked complete.
            </Text>
            <Text style={styles.label}>Pay mode</Text>
            <AdminFilterChips
              chips={[
                { key: 'percent', label: '% of job' },
                { key: 'flat', label: 'Flat ₹' },
              ]}
              selected={payMode}
              onSelect={(key) => setPayMode(key as 'percent' | 'flat')}
            />
            {payMode === 'percent' ? (
              <IconInput
                label="Percent of job value"
                value={payPercent}
                onChangeText={setPayPercent}
                keyboardType="decimal-pad"
                placeholder="e.g. 70"
              />
            ) : (
              <IconInput
                label="Flat pay (₹)"
                value={payFlat}
                onChangeText={setPayFlat}
                keyboardType="number-pad"
                placeholder="e.g. 500"
              />
            )}
            <Text style={styles.hint}>
              {payMode === 'percent'
                ? `Tech earns ${payPercent || '0'}% of each completed job total`
                : `Tech earns ₹${payFlat || '0'} per completed job`}
            </Text>
          </AdminFormCard>
        ) : null}
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.displayExtra, fontSize: 16, color: '#0B2213', letterSpacing: -0.3 },
  payTitle: { marginTop: spacing.lg },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.sm, marginTop: 2 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: 8 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 12 },
  flex: { flex: 1 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  toggleHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});
