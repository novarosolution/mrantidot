import { ContentCard, CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { SimpleMarkdown } from '@/components/ui/SimpleMarkdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppContent } from '@/context/AppContentContext';

export default function PrivacyScreen() {
  const { content } = useAppContent();
  return (
    <CustomerContentPage title="Privacy Policy" subtitle="How we protect your data">
      {content.legal.privacyMarkdown ? (
        <ContentCard>
          <SimpleMarkdown text={content.legal.privacyMarkdown} />
        </ContentCard>
      ) : (
        <EmptyState title="Privacy policy unavailable" message="Please contact support." />
      )}
    </CustomerContentPage>
  );
}
