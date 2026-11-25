import { LinearGradient } from 'expo-linear-gradient';
import { CalendarCheck, Globe, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { AuthHeroBackdrop } from '@/components/kit/auth/AuthBrandArt';
import { colors, fonts } from '@/constants/theme';
import { config } from '@/lib/config';

/** Browser windows at least this wide get the split sign-in (brand panel + form); narrower ones a centred card. */
const SPLIT_MIN_WIDTH = 960;

/** A real job photo that ships with the website (mranti/public). */
const WEBSITE_PHOTO = '/frontend/images/gallery/image-7.jpg';

const TRUST_LINES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: CalendarCheck, title: 'Bookings to payroll', body: 'Schedule jobs, assign technicians and track every visit.' },
  { icon: Globe, title: 'Website and app, live', body: 'Edit pages, photos and app text — changes show in about a minute.' },
  { icon: ShieldCheck, title: 'Admins only', body: 'Every sign-in is checked; customers book on the website.' },
];

/**
 * Where the brand photo comes from: EXPO_PUBLIC_WEBSITE_URL, or — when this export is served under a
 * sub-path of the website itself (mrantidot.com/admin) — the page's own origin. A resized copy from the
 * site's image optimiser first, then the original file; if both fail the panel shows the illustration.
 */
function photoCandidates(): string[] {
  const fromPage =
    process.env.EXPO_BASE_URL && typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
      ? window.location.origin
      : undefined;
  const site = config.websiteUrl ?? fromPage;
  if (!site) return [];
  return [`${site}/_next/image?url=${encodeURIComponent(WEBSITE_PHOTO)}&w=1200&q=70`, `${site}${WEBSITE_PHOTO}`];
}

function BrandPanel({ brandName }: { brandName: string }) {
  const { height } = useWindowDimensions();
  const candidates = useMemo(() => photoCandidates(), []);
  const [attempt, setAttempt] = useState(0);
  const photo = candidates[attempt];

  return (
    <View style={styles.panel}>
      <LinearGradient
        colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {photo ? (
        <>
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setAttempt((value) => value + 1)}
          />
          {/* Deep green scrim: keeps the copy readable on any photo. */}
          <LinearGradient
            colors={['rgba(2,24,12,0.30)', 'rgba(5,74,35,0.62)', 'rgba(2,24,12,0.94)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <AuthHeroBackdrop height={height} dense />
      )}

      <View style={styles.panelInner}>
        <View style={styles.panelBrand}>
          <View style={styles.logoTile}>
            <BrandLogo size={30} animate={false} />
          </View>
          <View>
            <Text style={styles.panelBrandName}>{brandName}</Text>
            <Text style={styles.panelBrandSub}>Admin panel</Text>
          </View>
        </View>

        <View style={styles.panelCopy}>
          <Text style={styles.panelHeadline}>Run every booking, team and page from one place.</Text>
          <View style={styles.trustList}>
            {TRUST_LINES.map(({ icon: Icon, title, body }) => (
              <View key={title} style={styles.trustRow}>
                <View style={styles.trustIcon}>
                  <Icon size={17} color={colors.limeOnDark} strokeWidth={2.2} />
                </View>
                <View style={styles.trustText}>
                  <Text style={styles.trustTitle}>{title}</Text>
                  <Text style={styles.trustBody}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.panelFoot}>© {new Date().getFullYear()} {brandName}</Text>
      </View>
    </View>
  );
}

function WebAuthFrameWeb({ children, brandName = 'Mr Antidot' }: { children: ReactNode; brandName?: string }) {
  const { width } = useWindowDimensions();

  if (width >= SPLIT_MIN_WIDTH) {
    return (
      <View style={styles.split}>
        <BrandPanel brandName={brandName} />
        <ScrollView style={styles.formSide} contentContainerStyle={styles.formSideInner} keyboardShouldPersistTaps="handled">
          <View style={styles.formColumn}>{children}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.narrow}>
      <LinearGradient
        colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.narrowInner} keyboardShouldPersistTaps="handled">
        <View style={styles.narrowBrand}>
          <View style={styles.logoTile}>
            <BrandLogo size={30} animate={false} />
          </View>
          <View>
            <Text style={styles.panelBrandName}>{brandName}</Text>
            <Text style={styles.panelBrandSub}>Admin panel</Text>
          </View>
        </View>
        <View style={styles.card}>{children}</View>
        <Text style={styles.narrowFoot}>© {new Date().getFullYear()} {brandName}</Text>
      </ScrollView>
    </View>
  );
}

function WebAuthFrameNative({ children }: { children: ReactNode; brandName?: string }) {
  return <>{children}</>;
}

/**
 * Web-only frame around the admin sign-in: wide windows get a split screen (brand panel with a real job
 * photo + the form), narrow windows and phones a centred card on the brand green. Renders its children
 * untouched on iOS / Android.
 */
export const WebAuthFrame = Platform.OS === 'web' ? WebAuthFrameWeb : WebAuthFrameNative;

const styles = StyleSheet.create({
  /* split (wide) */
  split: { flex: 1, flexDirection: 'row', backgroundColor: colors.white },
  panel: { width: '46%', maxWidth: 720, overflow: 'hidden', backgroundColor: colors.forestDeep },
  panelInner: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 48, paddingTop: 44, paddingBottom: 36 },
  panelBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoTile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#011A0A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  panelBrandName: { fontFamily: fonts.brand, fontSize: 18, lineHeight: 22, letterSpacing: -0.3, color: colors.white },
  panelBrandSub: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.limeOnDark,
    marginTop: 2,
  },
  panelCopy: { maxWidth: 460 },
  panelHeadline: {
    fontFamily: fonts.displayExtra,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.9,
    color: colors.white,
  },
  trustList: { marginTop: 28, gap: 18 },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  trustText: { flex: 1, minWidth: 0, paddingTop: 1 },
  trustTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, lineHeight: 20, color: colors.white },
  trustBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.76)', marginTop: 2 },
  panelFoot: { fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  formSide: { flex: 1, backgroundColor: colors.white },
  formSideInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 48, paddingVertical: 48 },
  formColumn: { width: '100%', maxWidth: 420 },

  /* narrow */
  narrow: { flex: 1, backgroundColor: colors.forestDeep },
  narrowInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 32 },
  narrowBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22, alignSelf: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.32,
    shadowRadius: 48,
  },
  narrowFoot: { marginTop: 18, fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.66)' },
});
