import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { FileText } from 'lucide-react-native';

export default function TermsScreen() {
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  return (
    <CustomerContentPage title={copy.termsTitle} subtitle={copy.termsSubtitle}>
      {content.legal.termsMarkdown ? (
        <ContentCard>
          <SimpleMarkdown text={content.legal.termsMarkdown} />
        </ContentCard>
      ) : (
        <EmptyState icon={FileText} title={copy.termsEmptyTitle} message={copy.legalEmptyMessage} />
      )}
    </CustomerContentPage>
  );
}
