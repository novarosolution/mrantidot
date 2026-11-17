import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { ListFaqRow, ListGroup, ListNavRow } from '@/components/kit/ListGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppIcons } from '@/constants/appIcons';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { customerRoutes, appPush } from '@/lib/routes';
import { spacing } from '@/constants/theme';

export default function FaqScreen() {
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <CustomerContentPage title={ui.profileMenuFaq} subtitle={ui.profileMenuFaqSub}>
      {content.faq.length === 0 ? (
        <EmptyState title="No FAQs yet" message="Check back soon." />
      ) : (
        // Question rows have no icon column, so hairlines run from the card's left padding.
        <ListGroup dividerInset={14}>
          {content.faq.map((item, i) => (
            <ListFaqRow
              key={i}
              question={item.q}
              answer={item.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </ListGroup>
      )}

      <View style={styles.more}>
        <ListGroup>
          <ListNavRow
            icon={AppIcons.ui.message}
            title="Still need help?"
            subtitle="Talk to our support team"
            onPress={() => appPush(customerRoutes.help)}
          />
        </ListGroup>
      </View>
    </CustomerContentPage>
  );
}

const styles = StyleSheet.create({
  more: { marginTop: spacing.md },
});
