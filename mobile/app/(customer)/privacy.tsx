import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { ShieldCheck } from 'lucide-react-native';

export default function PrivacyScreen() {
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  return (
    <CustomerContentPage title={copy.privacyTitle} subtitle={copy.privacySubtitle}>
      {content.legal.privacyMarkdown ? (
        <ContentCard>
          <SimpleMarkdown text={content.legal.privacyMarkdown} />
        </ContentCard>
      ) : (
        <EmptyState icon={ShieldCheck} title={copy.privacyEmptyTitle} message={copy.legalEmptyMessage} />
      )}
    </CustomerContentPage>
  );
}
