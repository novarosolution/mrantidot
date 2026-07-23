import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { fonts } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export function HomeServicesEmpty({ filtered }: { filtered?: boolean }) {
  const ui = useCustomerUiCopy();
  return (
    <View style={styles.wrap}>
      <PremiumIcon icon={AppIcons.empty} variant="ring" size="xl" color="#0B7228" boxSize={56} />
      <Text style={styles.title}>
        {filtered ? ui.homeEmptyNoMatchesTitle : ui.homeEmptyNoServicesTitle}
      </Text>
      <Text style={styles.message}>
        {filtered ? ui.homeEmptyNoMatchesMessage : ui.homeEmptyNoServicesMessage}
      </Text>
      <Pressable onPress={() => appPush(customerRoutes.services)} style={styles.btn}>
        <Text style={styles.btnText}>{ui.homeEmptyBrowseAll}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingVertical: 28, alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, color: '#0B2213', marginTop: 4 },
  message: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#86AC80' },
  btn: {
    marginTop: 8,
    backgroundColor: '#0B7228',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#FFFFFF' },
});
