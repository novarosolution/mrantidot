import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelpCircle, MessageCircle, Phone } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

function digits(v: string) {
  return v.replace(/[^\d+]/g, '');
}

export function ProfileSupportCard({
  phone,
  whatsapp,
  hours,
}: {
  phone?: string;
  whatsapp?: string;
  hours?: string;
}) {
  const wa = whatsapp || phone;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Need help?</Text>
      <View style={styles.row}>
        {phone ? (
          <Pressable style={styles.btn} onPress={() => Linking.openURL(`tel:${digits(phone)}`)}>
            <Phone size={18} color={colors.forest} strokeWidth={2} />
            <Text style={styles.btnLabel}>Call</Text>
          </Pressable>
        ) : null}
        {wa ? (
          <Pressable
            style={styles.btn}
            onPress={() => Linking.openURL(`https://wa.me/${digits(wa)}`)}
          >
            <MessageCircle size={18} color={colors.forest} strokeWidth={2} />
            <Text style={styles.btnLabel}>WhatsApp</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.btn} onPress={() => router.push('/(customer)/faq')}>
          <HelpCircle size={18} color={colors.forest} strokeWidth={2} />
          <Text style={styles.btnLabel}>FAQ</Text>
        </Pressable>
      </View>
      {hours ? <Text style={styles.hours}>{hours}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  hours: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
