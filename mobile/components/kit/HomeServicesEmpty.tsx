import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export function HomeServicesEmpty({ filtered }: { filtered?: boolean }) {
  const copy = useCustomerUiCopy();
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <SearchX size={26} color={ui.textSecondary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>
        {filtered ? copy.homeEmptyNoMatchesTitle : copy.homeEmptyNoServicesTitle}
      </Text>
      <Text style={styles.message}>
        {filtered ? copy.homeEmptyNoMatchesMessage : copy.homeEmptyNoServicesMessage}
      </Text>
      <Pressable
        onPress={() => appPush(customerRoutes.services)}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{copy.homeEmptyBrowseAll}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center', gap: 6 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 17, color: ui.text },
  message: { fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary, textAlign: 'center' },
  btn: {
    marginTop: 12,
    height: 40,
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
});
