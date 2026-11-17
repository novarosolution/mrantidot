import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';

export default function TermsScreen() {
  const { content } = useAppContent();
  return (
    <CustomerContentPage title="Terms of Service" subtitle="Please read carefully">
      {content.legal.termsMarkdown ? (
        <ContentCard>
          <SimpleMarkdown text={content.legal.termsMarkdown} />
        </ContentCard>
      ) : (
        <EmptyState title="Terms unavailable" message="Please contact support." />
      )}
    </CustomerContentPage>
  );
}
