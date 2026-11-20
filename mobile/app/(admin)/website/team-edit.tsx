import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminCollapsibleCard, AdminFormCard } from '@/components/kit/AdminPageKit';
import { AdminFormSkeleton } from '@/components/kit/AdminSkeletons';
import { IconInput } from '@/components/kit/IconInput';
import { ImageField, useBusyCounter } from '@/components/kit/ImageField';
import { StringListEditor } from '@/components/kit/StringListEditor';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { isHttpsUrl } from '@/constants/websiteAdmin';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminGoBack, adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { TeamMember, TeamMemberSocials, WebsiteImage } from '@/types/api';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SOCIALS: { key: keyof TeamMemberSocials; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/name' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/name' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/name' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/name' },
];

type Errors = Partial<Record<'name' | 'email' | 'photo' | 'years' | keyof TeamMemberSocials, string>>;

export default function WebsiteTeamEditScreen() {
  const id = paramString(useLocalSearchParams<{ id?: string | string[] }>().id);
  const [photo, setPhoto] = useState<WebsiteImage>({ url: '', alt: '' });
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [years, setYears] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [expertise, setExpertise] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [socials, setSocials] = useState<TeamMemberSocials>({ facebook: '', instagram: '', linkedin: '', x: '' });
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, onBusyChange] = useBusyCounter();
  const { loading, error, runLoad, reload } = useScreenLoad(!!id);

  // There is no single-member endpoint: load the admin list and pick this one.
  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<{ members: TeamMember[] }>('/website/admin/team', { ...screenLoadConfig, skipCache: true });
    const m = data.members.find((x) => x.id === id);
    if (!m) throw new Error('This team member was deleted.');
    setPhoto(m.photo ?? { url: '', alt: '' });
    setName(m.name);
    setRole(m.role ?? '');
    setYears(m.years ? String(m.years) : '');
    setBio(m.bio ?? '');
    setEducation(m.education ?? '');
    setCertifications(m.certifications ?? '');
    setResponsibilities(m.responsibilities ?? []);
    setExpertise(m.expertise ?? '');
    setEmail(m.email ?? '');
    setPhone(m.phone ?? '');
    setSocials({
      facebook: m.socials?.facebook ?? '',
      instagram: m.socials?.instagram ?? '',
      linkedin: m.socials?.linkedin ?? '',
      x: m.socials?.x ?? '',
    });
    setActive(m.active);
  }, [id]);

  useEffect(() => {
    if (id) void runLoad(load, 'Could not load this team member');
  }, [id, load, runLoad]);

  const onPhoto = useCallback((img: WebsiteImage) => {
    setPhoto(img);
    setErrors((e) => (e.photo ? { ...e, photo: undefined } : e));
  }, []);

  async function save() {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Name is required';
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email';
    if (photo.url && !photo.alt.trim()) next.photo = 'Add alt text for the photo';
    const yearsNum = years.trim() ? Number(years.trim()) : 0;
    if (years.trim() && (!Number.isFinite(yearsNum) || yearsNum < 0 || yearsNum > 80)) next.years = 'Enter 0–80';
    for (const s of SOCIALS) if (!isHttpsUrl(socials[s.key])) next[s.key] = 'Use a full link starting with https://';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      haptic('error');
      Toast.show({ type: 'error', text1: 'Fix the highlighted fields' });
      return;
    }
    const body = {
      name: name.trim(),
      role: role.trim(),
      photo: { url: photo.url, alt: photo.alt.trim() },
      bio: bio.trim(),
      education: education.trim(),
      certifications: certifications.trim(),
      responsibilities: responsibilities.map((r) => r.trim()).filter(Boolean),
      expertise: expertise.trim(),
      // 0 clears the field on the server.
      years: Math.round(yearsNum),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      socials: {
        facebook: socials.facebook.trim(),
        instagram: socials.instagram.trim(),
        linkedin: socials.linkedin.trim(),
        x: socials.x.trim(),
      },
      active,
    };
    setSaving(true);
    try {
      if (id) await api.patch(`/website/admin/team/${id}`, body, { skipErrorToast: true });
      else await api.post('/website/admin/team', body, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: id ? 'Team member saved' : 'Team member added' });
      adminGoBack(adminRoutes.websiteTeam);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the team member') });
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!id) return;
    void confirmAsync({
      title: 'Delete team member?',
      message: `${name || 'This person'} will be removed from the website.`,
      confirmLabel: 'Delete',
      destructive: true,
    }).then(async (ok) => {
      if (!ok) return;
      try {
        await api.delete(`/website/admin/team/${id}`, { skipErrorToast: true });
        haptic('success');
        Toast.show({ type: 'success', text1: 'Team member deleted' });
        adminGoBack(adminRoutes.websiteTeam);
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the team member') });
      }
    });
  }

  if (id && loading) {
    return (
      <AdminListShell title="Team member" subtitle="Website profile" backFallback={adminRoutes.websiteTeam}>
        <AdminFormSkeleton preview cards={[3, 3]} />
      </AdminListShell>
    );
  }

  if (id && error) {
    return (
      <AdminListShell title="Team member" subtitle="Could not load" backFallback={adminRoutes.websiteTeam}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const clear = (key: keyof Errors) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  return (
    <AdminListShell
      title={id ? 'Edit team member' : 'New team member'}
      subtitle="Profile on the website Team page"
      backFallback={adminRoutes.websiteTeam}
      keyboardAvoid
      stickyFooter={
        <StickyActionBar row>
          {id ? (
            <Button title="Delete" variant="dangerOutline" onPress={remove} fullWidth={false} style={styles.footSecondary} />
          ) : null}
          <Button
            title={uploading ? 'Uploading…' : 'Save'}
            variant="premium"
            onPress={() => void save()}
            loading={saving}
            disabled={saving || uploading}
            fullWidth={false}
            style={styles.footPrimary}
          />
        </StickyActionBar>
      }
    >
      <ScrollView
        contentContainerStyle={adminListShellStyles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn delay={stagger(0)} slideFrom={14}>
          <AdminFormCard>
            <ImageField
              label="Photo"
              hint="A friendly, well-lit headshot works best"
              value={photo}
              onChange={onPhoto}
              aspectRatio={1}
              onBusyChange={onBusyChange}
              altPlaceholder={name ? `${name}, ${role || 'team member'}` : 'e.g. Ronak, founder'}
            />
            {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}
            <View style={styles.toggleRow}>
              <View style={styles.flex}>
                <Text style={styles.toggleLabel}>Show on website</Text>
                <Text style={styles.toggleHint}>{active ? 'Visible on the Team page' : 'Hidden from the website'}</Text>
              </View>
              <ToggleSwitch value={active} onToggle={() => setActive((v) => !v)} accessibilityLabel="Show on website" />
            </View>
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(1)} slideFrom={14}>
          <AdminFormCard>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardHint}>Name, role and a short story</Text>
            <IconInput
              label="Name"
              value={name}
              maxLength={80}
              onChangeText={(t) => {
                setName(t);
                clear('name');
              }}
              error={errors.name}
            />
            <IconInput label="Role" value={role} maxLength={120} onChangeText={setRole} placeholder="e.g. Senior technician" />
            <IconInput
              label="Years of experience"
              value={years}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(t) => {
                setYears(t.replace(/\D/g, ''));
                clear('years');
              }}
              placeholder="Leave empty to hide"
              error={errors.years}
            />
            <IconInput label="Bio" value={bio} maxLength={4000} multiline onChangeText={setBio} hint={`${bio.length}/4000`} />
          </AdminFormCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(2)} slideFrom={14}>
          <AdminCollapsibleCard
            title="Skills & background"
            subtitle="Education, certificates, duties, expertise"
            defaultOpen={Boolean(education || certifications || responsibilities.length || expertise)}
          >
            <IconInput label="Education" value={education} maxLength={500} multiline onChangeText={setEducation} />
            <IconInput
              label="Certifications"
              value={certifications}
              maxLength={2000}
              multiline
              onChangeText={setCertifications}
              placeholder={'- Licensed pest control operator\n- First aid trained'}
              hint="Markdown: start lines with - for a list, **bold** for emphasis"
            />
            <StringListEditor
              title={`Responsibilities · ${responsibilities.length}/12`}
              items={responsibilities}
              onChange={setResponsibilities}
              max={12}
              placeholder="e.g. Leads termite treatments"
              fill
            />
            <IconInput
              label="Expertise"
              value={expertise}
              maxLength={1000}
              multiline
              onChangeText={setExpertise}
              containerStyle={styles.mtMd}
            />
          </AdminCollapsibleCard>
        </FadeSlideIn>

        <FadeSlideIn delay={stagger(3)} slideFrom={14}>
          <AdminCollapsibleCard
            title="Contact & social"
            subtitle="Shown on the person’s profile page"
            defaultOpen={Boolean(email || phone || Object.values(socials).some(Boolean))}
          >
            <IconInput
              label="Email"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={120}
              onChangeText={(t) => {
                setEmail(t);
                clear('email');
              }}
              error={errors.email}
            />
            <IconInput label="Phone" value={phone} keyboardType="phone-pad" maxLength={20} onChangeText={setPhone} />
            {SOCIALS.map((s) => (
              <IconInput
                key={s.key}
                label={s.label}
                value={socials[s.key]}
                autoCapitalize="none"
                keyboardType="url"
                placeholder={s.placeholder}
                onChangeText={(t) => {
                  setSocials((prev) => ({ ...prev, [s.key]: t }));
                  clear(s.key);
                }}
                error={errors[s.key]}
              />
            ))}
          </AdminCollapsibleCard>
        </FadeSlideIn>
      </ScrollView>
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  footSecondary: { flex: 1 },
  footPrimary: { flex: 1.6 },
  cardTitle: { ...adminType.formTitle, fontSize: 16, color: ui.text },
  cardHint: { ...adminType.formSub, fontSize: 12, color: ui.textSecondary, marginBottom: spacing.md },
  error: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error, marginTop: -spacing.sm, marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  toggleLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  toggleHint: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  mtMd: { marginTop: spacing.md },
});
