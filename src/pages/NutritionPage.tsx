/**
 * NutritionPage — Standalone page for nutrition tracking.
 * Contains two tabs: Meals (Ernährung) and Body (Körper).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';

import { MealsTabContent } from '../features/meals/components/MealsTabContent';
import { BodyTabContent } from '../features/body/components/BodyTabContent';

type NutritionTab = 'meals' | 'body';

export function NutritionPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NutritionTab>('meals');

  const [showMealsDialog, setShowMealsDialog] = useState(false);
  const [showBodyDialog, setShowBodyDialog] = useState(false);

  const tabs: { key: NutritionTab; label: string }[] = [
    { key: 'meals', label: t.tracking.nutrition },
    { key: 'body', label: t.tracking.body },
  ];

  const handleAddAction = () => {
    switch (activeTab) {
      case 'meals': setShowMealsDialog(true); break;
      case 'body': setShowBodyDialog(true); break;
    }
  };

  return (
    <PageShell
      title={t.tracking.nutrition}
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
      {activeTab === 'meals' && (
        <MealsTabContent
          showAddDialog={showMealsDialog}
          onOpenAddDialog={() => setShowMealsDialog(true)}
          onCloseAddDialog={() => setShowMealsDialog(false)}
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
