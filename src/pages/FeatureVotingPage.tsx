import { useState } from 'react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { FeatureRequestList } from '../features/feedback/components/FeatureRequestList';
import { FeedbackDialog } from '../features/feedback/components/FeedbackDialog';

export function FeatureVotingPage() {
  const { t } = useTranslation();
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <PageShell title={t.feedback.featureRequests}>
      <FeatureRequestList onSubmitNew={() => setShowSubmit(true)} />
      <FeedbackDialog
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
      />
    </PageShell>
  );
}
