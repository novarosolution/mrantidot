import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { BookingGuide } from '@/components/kit/BookingGuide';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { spacing, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** How-to-book guide — helps customers complete a service booking. */
export default function BookGuideScreen() {
  const copy = useCustomerUiCopy();
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader
          title={copy.guideTitle}
          subtitle={copy.guideSubtitle}
          showBack
          variant="premium"
        />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <BookingGuide />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  safe: { flex: 1 },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_SCROLL_PAD + spacing.lg,
  },
});
