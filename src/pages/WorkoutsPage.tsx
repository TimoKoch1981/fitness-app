import { Plus, Dumbbell } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

export function WorkoutsPage() {
  const { t } = useTranslation();

  return (
    <PageShell
      title={t.workouts.title}
      actions={
        <button
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div className="text-center py-16">
        <Dumbbell className="h-16 w-16 mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">{t.common.noData}</p>
        <p className="text-sm text-gray-400 mt-2">
          Workout-Tracking wird in Phase 3b implementiert
        </p>
      </div>
    </PageShell>
  );
}
