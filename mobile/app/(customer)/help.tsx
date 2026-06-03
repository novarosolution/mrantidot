import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Shield,
} from 'lucide-react-native';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Card } from '@/components/ui/Card';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, radius, spacing } from '@/constants/theme';

export default function HelpScreen() {
  const { content } = useAppContent();
  const { support } = content;

  const digits = (v: string) => v.replace(/[^\d+]/g, '');

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader title="Help & support" subtitle="We're here for you" variant="premium" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Contact us</Text>
        <Card variant="premium" style={styles.card}>
          {support.phone ? (
            <ContactRow
              icon={<Phone size={18} color={colors.green} />}
              label="Call us"
              value={support.phone}
              onPress={() => Linking.openURL(`tel:${digits(support.phone)}`)}
            />
          ) : null}
          {support.whatsapp ? (
            <ContactRow
              icon={<MessageCircle size={18} color={colors.green} />}
              label="WhatsApp"
              value={support.whatsapp}
              onPress={() => Linking.openURL(`https://wa.me/${digits(support.whatsapp ?? '')}`)}
            />
          ) : null}
          {support.email ? (
            <ContactRow
              icon={<Mail size={18} color={colors.green} />}
              label="Email"
              value={support.email}
              onPress={() => Linking.openURL(`mailto:${support.email}`)}
            />
          ) : null}
          {support.hours ? (
            <ContactRow icon={<Clock size={18} color={colors.green} />} label="Hours" value={support.hours} />
          ) : null}
        </Card>

        <Text style={styles.section}>Resources</Text>
        <Card variant="premium" style={styles.card}>
          <LinkRow icon={<HelpCircle size={18} color={colors.green} />} label="FAQ" onPress={() => router.push('/(customer)/faq')} />
          <LinkRow icon={<Info size={18} color={colors.green} />} label="About us" onPress={() => router.push('/(customer)/about')} />
          <LinkRow icon={<FileText size={18} color={colors.green} />} label="Terms of Service" onPress={() => router.push('/(customer)/terms')} />
          <LinkRow icon={<Shield size={18} color={colors.green} />} label="Privacy Policy" onPress={() => router.push('/(customer)/privacy')} last />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.flex}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress ? <ChevronRight size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.row, last && styles.rowLast]} onPress={onPress}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.rowLabel, styles.flex]}>{label}</Text>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { ...design.sectionTitle, marginTop: spacing.md, marginBottom: spacing.sm },
  card: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  rowValue: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
});
