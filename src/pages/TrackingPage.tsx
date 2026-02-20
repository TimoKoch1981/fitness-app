/**
 * TrackingPage — Combined tracking page with 3 tabs: Nutrition, Training, Body.
 *
 * Replaces the standalone MealsPage, WorkoutsPage, and BodyPage.
 * Each tab renders its extracted content component.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';

import { MealsTabContent } from '../features/meals/components/MealsTabContent';
import { WorkoutsTabContent } from '../features/workouts/components/WorkoutsTabContent';
import { BodyTabContent } from '../features/body/components/BodyTabContent';

type TrackingTab = 'nutrition' | 'training' | 'body';

export function TrackingPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TrackingTab>('nutrition');

  // Dialog states — one per tab, managed here so PageShell action button works
  const [showMealsDialog, setShowMealsDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [showBodyDialog, setShowBodyDialog] = useState(false);

  const tabs: { key: TrackingTab; label: string }[] = [
    { key: 'nutrition', label: t.tracking.nutrition },
    { key: 'training', label: t.tracking.training },
    { key: 'body', label: t.tracking.body },
  ];

  // Plus button opens the dialog for the active tab
  const handleAddAction = () => {
    switch (activeTab) {
      case 'nutrition': setShowMealsDialog(true); break;
      case 'training': setShowWorkoutDialog(true); break;
      case 'body': setShowBodyDialog(true); break;
    }
  };

  return (
    <PageShell
      title={t.tracking.title}
      actions={
        <button
          onClick={handleAddAction}
          className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all',
              activeTab === tab.key
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'nutrition' && (
        <MealsTabContent
          showAddDialog={showMealsDialog}
          onOpenAddDialog={() => setShowMealsDialog(true)}
          onCloseAddDialog={() => setShowMealsDialog(false)}
        />
      )}
      {activeTab === 'training' && (
        <WorkoutsTabContent
          showAddDialog={showWorkoutDialog}
          onOpenAddDialog={() => setShowWorkoutDialog(true)}
          onCloseAddDialog={() => setShowWorkoutDialog(false)}
        />
      )}
      {activeTab === 'body' && (
        <BodyTabContent
          showAddDialog={showBodyDialog}
          onOpenAddDialog={() => setShowBodyDialog(true)}
          onCloseAddDialog={() => setShowBodyDialog(false)}
        />
      )}
    </PageShell>
  );
}
