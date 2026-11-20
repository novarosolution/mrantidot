import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminFormCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { useAuth } from '@/context/AuthContext';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
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
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'phone' | 'email' | 'password' | 'displayRating', string>>
  >({});
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
    const next: Partial<Record<'name' | 'phone' | 'email' | 'password' | 'displayRating', string>> = {};
    if (!name.trim()) next.name = 'Required';
    if (!email.trim()) next.email = 'Required';
    if (!phone.trim()) next.phone = 'Required';
    if (!id && password.length < 8) next.password = 'At least 8 characters';
    if (role === 'technician' && displayRating.trim()) {
      const dr = parseFloat(displayRating);
      if (Number.isNaN(dr) || dr < 0 || dr > 5) next.displayRating = 'Must be between 0 and 5';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Fix the highlighted fields' });
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
            body.displayRating = parseFloat(displayRating);
          } else {
            body.displayRating = null;
          }
          body.payMode = payMode;
          if (payMode === 'percent') {
            const pct = parseFloat(payPercent);
            if (Number.isNaN(pct) || pct < 0 || pct > 100) {
              haptic('error');
              Toast.show({ type: 'error', text1: 'Pay percent must be 0–100' });
              setSaving(false);
              return;
            }
            body.payPercent = pct;
          } else {
            const flat = parseFloat(payFlat);
            if (Number.isNaN(flat) || flat < 0) {
              haptic('error');
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
      haptic('success');
      Toast.show({ type: 'success', text1: 'Saved' });
      adminGoBack(returnTo);
    } catch (err) {
      haptic('error');
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
              haptic('success');
              Toast.show({ type: 'success', text1: 'Account disabled' });
              adminGoBack(returnTo);
            } catch (err) {
              haptic('error');
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not disable account') });
            }
          })();
        },
      },
    ]);
  }

  const title = id ? 'Edit user' : `Add ${role}`;
  const subtitle = id ? `Role: ${role}` : 'New account';

  if (id && loading) {
    return (
      <AdminListShell title="Edit user" subtitle="Loading account…" backFallback={returnTo}>
        <AdminFormSkeleton cards={[5, 2]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="User" subtitle="Error" backFallback={returnTo}>
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
        <StickyActionBar row>
          {id && active && !roleLocked ? (
            <Button title="Disable" variant="dangerOutline" onPress={disableAccount} fullWidth={false} style={styles.footerSecondary} />
          ) : null}
          <Button title="Save" variant="premium" onPress={() => void save()} loading={saving} fullWidth={false} style={styles.footerPrimary} />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <AdminFormCard>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.sectionHint}>Who they are and how they sign in</Text>
            <Text style={styles.label}>Role</Text>
            <AdminFilterChips
              chips={ROLES.map((r) => ({ key: r.key, label: r.label, disabled: roleLocked }))}
              selected={role}
              onSelect={(key) => {
                if (roleLocked) {
                  Toast.show({
                    type: 'info',
                    text1: 'Role locked',
                    text2: 'The primary admin account cannot change role.',
                  });
                  return;
                }
                setRole(key as UserRole);
              }}
            />
            {roleLocked ? (
              <Text style={styles.hint}>Primary admin role is locked and cannot be changed.</Text>
            ) : null}

            <IconInput
              label="Name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              error={errors.name}
            />
            <IconInput
              label="Phone"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
              }}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <IconInput
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              autoCapitalize="none"
              error={errors.email}
            />
            <IconInput label="City" value={city} onChangeText={setCity} />
            <IconInput
              label={id ? 'New password (optional)' : 'Password'}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              secure
              error={errors.password}
            />

            {id ? (
              <View style={styles.toggleRow}>
                <View style={styles.flex}>
                  <Text style={styles.toggleLabel}>Account active</Text>
                </View>
                <ToggleSwitch
                  value={active}
                  onToggle={() => !roleLocked && setActive((v) => !v)}
                  accessibilityLabel="Account active"
                />
              </View>
            ) : null}
          </AdminFormCard>
        </FadeSlideIn>

        {role === 'technician' ? (
          <FadeSlideIn delay={stagger(1)} slideFrom={14}>
            <AdminFormCard>
              <Text style={styles.sectionTitle}>Technician</Text>
              <Text style={styles.sectionHint}>Duty status and public rating</Text>
              {id ? (
                <>
                  <IconInput
                    label="Public rating"
                    value={displayRating}
                    onChangeText={(t) => {
                      setDisplayRating(t);
                      if (errors.displayRating) setErrors((e) => ({ ...e, displayRating: undefined }));
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Empty = real average"
                    error={errors.displayRating}
                  />
                  {realTechRating != null ? (
                    <Text style={styles.hint}>Real avg: ★ {realTechRating.toFixed(1)}</Text>
                  ) : null}
                  <View style={styles.toggleRow}>
                    <View style={styles.flex}>
                      <Text style={styles.toggleLabel}>On duty</Text>
                    </View>
                    <ToggleSwitch
                      value={available}
                      onToggle={() => setAvailable((v) => !v)}
                      accessibilityLabel="On duty"
                    />
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
          </FadeSlideIn>
        ) : null}
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.6 },
  sectionTitle: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.ink, letterSpacing: -0.3 },
  payTitle: { marginTop: spacing.lg },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.sm, marginTop: 2 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: 8 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: 12 },
  flex: { flex: 1 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  toggleHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});
