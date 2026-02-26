/**
 * TrainingPage — Standalone page for workout tracking.
 * Contains WorkoutsTabContent with its own sub-tabs (Today, Plan, History).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

import { WorkoutsTabContent } from '../features/workouts/components/WorkoutsTabContent';

export function TrainingPage() {
  const { t } = useTranslation();
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);

  return (
    <PageShell
      title={t.tracking.training}
      actions={
        <button
          onClick={() => setShowWorkoutDialog(true)}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <WorkoutsTabContent
        showAddDialog={showWorkoutDialog}
        onOpenAddDialog={() => setShowWorkoutDialog(true)}
        onCloseAddDialog={() => setShowWorkoutDialog(false)}
      />
    </PageShell>
  );
}
