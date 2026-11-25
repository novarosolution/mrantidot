import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAppContent } from '@/context/AppContentContext';
import { fonts, radii, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Quiet reassurance panel that closes catalogue screens — the admin's trust badges, else the guarantee line. */
export function TrustNote({ style }: { style?: StyleProp<ViewStyle> }) {
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const badges = (content.trust.badges ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 3);
  const sub = badges.length > 0 ? badges.join(' · ') : content.trust.guaranteeText?.trim() || copy.homeTrustHeadline;

  return (
    <View style={[styles.wrap, style]}>
      <ShieldCheck size={22} color={ui.brand} strokeWidth={2} />
      <View style={styles.body}>
        <Text style={styles.title}>{copy.trustNoteTitle}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radii.card,
    backgroundColor: ui.brandSoft,
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  sub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
});
