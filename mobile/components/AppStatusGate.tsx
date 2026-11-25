import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Download, LogIn, RefreshCw, Wrench } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SplashMark } from '@/components/kit/auth/AuthScreenKit';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useAuth } from '@/context/AuthContext';
import { refreshBusinessSettings, useBusinessSettings } from '@/lib/businessSettings';
import { useBrandFill, useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, spacing } from '@/constants/theme';

/** "1.2.10" vs "1.2.9" → 1; missing parts count as 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** Version of this build (app config `version`). */
export function installedAppVersion(): string {
  return Constants.expoConfig?.version ?? '';
}

/**
 * Business settings → App status, applied to everyone except admins:
 *  - maintenance on → a full-screen "we'll be right back" (admin message or the default words) with retry;
 *  - this build older than the minimum version → a force-update screen that opens the store link.
 * Admins always pass (so they can switch maintenance off). Signed-out people get a small "Team sign-in"
 * link during maintenance. The web build is the admin panel and always passes.
 * Settings are re-read whenever the app comes back to the foreground.
 *
 * Mount inside AuthProvider + AppContentProvider, around the root navigator (app/_layout.tsx).
 */
export function AppStatusGate({ children }: { children: ReactNode }) {
  const settings = useBusinessSettings();
  const { user, isLoading } = useAuth();
  const [staffSignIn, setStaffSignIn] = useState(false);

  useEffect(() => {
    void refreshBusinessSettings(true);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshBusinessSettings(true);
    });
    return () => sub.remove();
  }, []);

  // A non-admin who signed in through "Team sign-in" goes back behind the gate.
  useEffect(() => {
    if (user && user.role !== 'admin') setStaffSignIn(false);
  }, [user]);

  // The web build is the admin panel: never gated.
  if (Platform.OS === 'web') return <>{children}</>;

  let blocker: ReactNode = null;
  if (!isLoading && user?.role !== 'admin') {
    const { maintenance, maintenanceMessage, minVersion, iosUrl, androidUrl } = settings.app;
    const installed = installedAppVersion();
    if (maintenance && !(staffSignIn && !user)) {
      blocker = <MaintenanceScreen message={maintenanceMessage} onStaffSignIn={user ? undefined : () => setStaffSignIn(true)} />;
    } else if (minVersion && installed && compareVersions(installed, minVersion) < 0) {
      blocker = <UpdateScreen storeUrl={Platform.OS === 'ios' ? iosUrl : androidUrl} installed={installed} />;
    }
  }

  // The navigator stays mounted underneath and the gate is laid over it. Unmounting expo-router's root
  // Stack would break any navigation made while the gate is up (a session-expiry redirect, a notification
  // tap…) and lose the navigation state when it lifts. The tree is the same in every state, so nothing
  // remounts when auth finishes loading or the gate opens and closes.
  return (
    <View style={styles.host}>
      <View
        style={styles.host}
        pointerEvents={blocker ? 'none' : 'auto'}
        importantForAccessibility={blocker ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={blocker !== null}
      >
        {children}
      </View>
      {blocker ? <View style={StyleSheet.absoluteFill}>{blocker}</View> : null}
    </View>
  );
}

/* ---------- screens ---------- */

function StatusShell({
  icon,
  badge,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  badge: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* Mounted last, so it beats the dark status bar of the (still mounted) screen underneath. */}
      <StatusBar style="light" />
      <PremiumAurora topFade={false} />
      <View style={[styles.stage, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.center}>
          <FadeSlideIn delay={0} slideFrom={10}>
            <SplashMark size={84} />
          </FadeSlideIn>
          <FadeSlideIn delay={90} slideFrom={12}>
            <View style={styles.badge} accessibilityRole="text">
              {icon}
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          </FadeSlideIn>
          <FadeSlideIn delay={160} slideFrom={14}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.text}>{text}</Text>
          </FadeSlideIn>
        </View>
        <FadeSlideIn delay={240} slideFrom={16}>
          <View style={styles.actions}>{children}</View>
        </FadeSlideIn>
      </View>
    </View>
  );
}

function MaintenanceScreen({ message, onStaffSignIn }: { message: string; onStaffSignIn?: () => void }) {
  const copy = useCustomerUiCopy();
  const { fill } = useBrandFill();
  const [checking, setChecking] = useState(false);

  const retry = useCallback(async () => {
    setChecking(true);
    try {
      await refreshBusinessSettings(true);
    } finally {
      setChecking(false);
    }
  }, []);

  return (
    <StatusShell
      icon={<Wrench size={13} color={colors.limeOnDark} strokeWidth={2.4} />}
      badge={copy.appMaintenanceBadge}
      title={fill(copy.appMaintenanceTitle)}
      text={message.trim() || fill(copy.appMaintenanceText)}
    >
      <Button
        title={copy.appMaintenanceRetry}
        variant="gold"
        loading={checking}
        disabled={checking}
        onPress={() => void retry()}
        accessibilityHint="Checks again whether the app is back"
      />
      {onStaffSignIn ? (
        <Pressable
          onPress={onStaffSignIn}
          hitSlop={10}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <LogIn size={14} color="rgba(255,255,255,0.72)" strokeWidth={2.2} />
          <Text style={styles.linkText}>{copy.appMaintenanceStaff}</Text>
        </Pressable>
      ) : null}
    </StatusShell>
  );
}

function UpdateScreen({ storeUrl, installed }: { storeUrl: string; installed: string }) {
  const copy = useCustomerUiCopy();
  const { fill } = useBrandFill();
  const [checking, setChecking] = useState(false);

  return (
    <StatusShell
      icon={<Download size={13} color={colors.limeOnDark} strokeWidth={2.4} />}
      badge={copy.appUpdateBadge.replace('{version}', installed)}
      title={fill(copy.appUpdateTitle)}
      text={fill(copy.appUpdateText)}
    >
      {storeUrl ? (
        <Button
          title={copy.appUpdateButton}
          variant="gold"
          onPress={() => void Linking.openURL(storeUrl).catch(() => undefined)}
        />
      ) : null}
      <Pressable
        onPress={() => {
          setChecking(true);
          void refreshBusinessSettings(true).finally(() => setChecking(false));
        }}
        disabled={checking}
        hitSlop={10}
        style={({ pressed }) => [styles.link, (pressed || checking) && styles.pressed]}
        accessibilityRole="button"
      >
        <RefreshCw size={14} color="rgba(255,255,255,0.72)" strokeWidth={2.2} />
        <Text style={styles.linkText}>{copy.appMaintenanceRetry}</Text>
      </Pressable>
    </StatusShell>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.deep },
  stage: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(185,229,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(185,229,138,0.28)',
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 0.2, color: colors.limeOnDark },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: colors.white,
    textAlign: 'center',
  },
  text: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  actions: { gap: 14, alignItems: 'stretch' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: 'rgba(255,255,255,0.78)' },
  pressed: { opacity: 0.6 },
});
