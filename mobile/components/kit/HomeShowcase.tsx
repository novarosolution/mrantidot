import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { PressableScale } from '@/components/ui/PressableScale';
import { formatRupeeFull } from '@/components/kit/format';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import type { ServiceTypeKey } from '@/constants/serviceTypes';
import type { Service } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';

function metaFor(s: Service) {
  const key = (s.serviceTypes?.[0] ?? 'general') as ServiceTypeKey;
  return SERVICE_TYPE_META[key] ?? SERVICE_TYPE_META.general;
}

/* ─── In the spotlight — wide cards, neighbours peek in ─── */

export function SpotlightCarousel({
  title,
  services,
  ctaLabel,
  onOpen,
  onBook,
}: {
  title: string;
  services: Service[];
  ctaLabel: string;
  onOpen: (s: Service) => void;
  onBook: (s: Service) => void;
}) {
  const { width } = useWindowDimensions();
  const cardW = width - 64;
  if (services.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardW + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.spotRow}
      >
        {services.map((s) => {
          const meta = metaFor(s);
          return (
            <PressableScale
              key={s.id}
              containerStyle={{ width: cardW }}
              style={[styles.spotCard, { backgroundColor: meta.bg }]}
              scaleTo={0.98}
              onPress={() => onOpen(s)}
              accessibilityRole="button"
              accessibilityLabel={`${s.name}, starts at ₹${s.basePrice}`}
            >
              <View style={styles.spotDisc} pointerEvents="none" />
              <Image source={meta.image} style={styles.spotArt} resizeMode="contain" />
              <View style={styles.spotText}>
                <Text style={styles.spotKicker}>{meta.label}</Text>
                <Text style={styles.spotTitle} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.spotPrice}>
                  Starts at <Text style={styles.spotPriceBold}>{formatRupeeFull(s.basePrice)}</Text>
                </Text>
                <PressableScale
                  containerStyle={styles.spotCtaWrap}
                  style={styles.spotCta}
                  scaleTo={0.94}
                  onPress={() => onBook(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${s.name}`}
                >
                  <Text style={styles.spotCtaText}>{ctaLabel}</Text>
                </PressableScale>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ─── Newly added — small square tiles with a two-line name underneath ─── */

const NEW_TILE = 100;

export function NewArrivalsRail({
  title,
  services,
  onOpen,
}: {
  title: string;
  services: Service[];
  onOpen: (s: Service) => void;
}) {
  if (services.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newRow}>
        {services.map((s) => (
          <PressableScale
            key={s.id}
            containerStyle={{ width: NEW_TILE }}
            scaleTo={0.96}
            onPress={() => onOpen(s)}
            accessibilityRole="button"
            accessibilityLabel={s.name}
          >
            <ServiceThumb service={s} width={NEW_TILE} height={NEW_TILE} radius={16} iconSize={52} />
            <Text style={styles.newLabel} numberOfLines={2}>
              {s.name}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

/* ─── Thoughtful curations — tall portrait cards with editorial type ─── */

export function CurationsRail({
  title,
  subtitle,
  types,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  types: ServiceTypeKey[];
  onOpen: (type: ServiceTypeKey) => void;
}) {
  if (types.length === 0) return null;
  return (
    <View>
      <HomeSectionTitle title={title} subtitle={subtitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.curRow}>
        {types.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          return (
            <PressableScale
              key={key}
              containerStyle={styles.curWrap}
              style={styles.curCard}
              scaleTo={0.96}
              onPress={() => onOpen(key)}
              accessibilityRole="button"
              accessibilityLabel={`${meta.label} treatments`}
            >
              <LinearGradient
                colors={[meta.bg, meta.color, '#0E1511']}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Image source={meta.image} style={styles.curArt} resizeMode="contain" />
              <LinearGradient
                colors={['rgba(14,21,17,0)', 'rgba(14,21,17,0.75)']}
                style={styles.curShade}
                pointerEvents="none"
              />
              <View style={styles.curText}>
                <Text style={styles.curScript}>Expert</Text>
                <Text style={styles.curBig} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {meta.label.toUpperCase()}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ─── Feature banner — one big product moment ─── */

export function FeatureBanner({
  tag,
  service,
  ctaLabel,
  onOpen,
  onBook,
}: {
  tag: string;
  service?: Service;
  ctaLabel: string;
  onOpen: (s: Service) => void;
  onBook: (s: Service) => void;
}) {
  if (!service) return null;
  const meta = metaFor(service);
  return (
    <PressableScale
      containerStyle={styles.featWrap}
      style={styles.feat}
      scaleTo={0.985}
      onPress={() => onOpen(service)}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, starts at ₹${service.basePrice}`}
    >
      <LinearGradient colors={['#F6F1E7', meta.bg, '#E4EFE6']} style={StyleSheet.absoluteFill} />
      <View style={styles.featBeam} pointerEvents="none" />
      <View style={styles.featTag}>
        <Text style={styles.featTagText}>{tag}</Text>
      </View>
      <Text style={styles.featTitle} numberOfLines={2}>
        {service.name}
      </Text>
      {service.shortDesc ? (
        <Text style={styles.featSub} numberOfLines={2}>
          {service.shortDesc}
        </Text>
      ) : null}
      <Image source={meta.image} style={styles.featArt} resizeMode="contain" />
      <LinearGradient
        colors={['rgba(6,54,27,0.94)', 'rgba(10,90,43,0.96)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featBar}
      >
        <View style={styles.featBarText}>
          <Text style={styles.featBarName}>Starts at</Text>
          <Text style={styles.featBarPrice}>{formatRupeeFull(service.basePrice)}</Text>
        </View>
        <PressableScale
          style={styles.featCta}
          scaleTo={0.94}
          onPress={() => onBook(service)}
          accessibilityRole="button"
          accessibilityLabel={`Book ${service.name}`}
        >
          <Text style={styles.featCtaText}>{ctaLabel}</Text>
        </PressableScale>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  spotRow: { paddingHorizontal: 16, gap: 12 },
  spotCard: { height: 176, borderRadius: 18, overflow: 'hidden', flexDirection: 'row' },
  spotDisc: {
    position: 'absolute',
    right: -46,
    bottom: -58,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  spotArt: { position: 'absolute', right: -4, bottom: -2, width: 158, height: 158 },
  spotText: { width: '62%', padding: 18, justifyContent: 'center' },
  spotKicker: { fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary },
  spotTitle: {
    marginTop: 3,
    fontFamily: fonts.displaySemi,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.45,
    color: ui.text,
  },
  spotPrice: { marginTop: 6, fontFamily: fonts.body, fontSize: 14, color: ui.text },
  spotPriceBold: { fontFamily: fonts.bodySemi },
  spotCtaWrap: { alignSelf: 'flex-start', marginTop: 12 },
  spotCta: { height: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: ui.text, justifyContent: 'center' },
  spotCtaText: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.white },

  newRow: { paddingHorizontal: 16, gap: 16 },
  newLabel: { marginTop: 8, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: ui.text },

  curRow: { paddingHorizontal: 16, gap: 12 },
  curWrap: { width: 152 },
  curCard: { height: 262, borderRadius: 16, overflow: 'hidden' },
  curArt: { position: 'absolute', top: 22, alignSelf: 'center', width: 130, height: 130 },
  curShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  curText: { position: 'absolute', left: 14, right: 12, bottom: 16 },
  curScript: { fontFamily: fonts.serifItalic, fontSize: 26, lineHeight: 28, color: 'rgba(255,255,255,0.95)' },
  curBig: { fontFamily: fonts.bodySemi, fontSize: 21, lineHeight: 27, letterSpacing: 0.8, color: colors.white },

  featWrap: { marginHorizontal: 16 },
  feat: { height: 460, borderRadius: 20, overflow: 'hidden', alignItems: 'center', paddingTop: 24 },
  featBeam: {
    position: 'absolute',
    width: 520,
    height: 120,
    top: 120,
    left: -120,
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-28deg' }],
  },
  featTag: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: ui.text,
    justifyContent: 'center',
  },
  featTagText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.text },
  featTitle: {
    marginTop: 12,
    paddingHorizontal: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
    color: ui.text,
  },
  featSub: {
    marginTop: 6,
    paddingHorizontal: 30,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: ui.textSecondary,
  },
  featArt: { flex: 1, width: '78%', marginBottom: 80 },
  featBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  featBarText: { flex: 1, minWidth: 0 },
  featBarName: { fontFamily: fonts.body, fontSize: 13.5, color: 'rgba(255,255,255,0.75)' },
  featBarPrice: { marginTop: 1, fontFamily: fonts.displaySemi, fontSize: 24, letterSpacing: -0.5, color: colors.white },
  featCta: { height: 44, paddingHorizontal: 22, borderRadius: 10, backgroundColor: colors.white, justifyContent: 'center' },
  featCtaText: { fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text },
});
