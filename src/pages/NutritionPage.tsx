/**
 * NutritionPage — Standalone page for nutrition tracking.
 * Contains three tabs: Meals (Ernaehrung), Recipes (Rezepte), and Body (Koerper).
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { ComponentErrorBoundary } from '../shared/components/ComponentErrorBoundary';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';

import { MealsTabContent } from '../features/meals/components/MealsTabContent';
import { RecipesTabContent } from '../features/recipes/components/RecipesTabContent';
import { NutritionHistoryTab } from '../features/meals/components/NutritionHistoryTab';

type NutritionTab = 'meals' | 'recipes' | 'history';

export function NutritionPage() {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<NutritionTab>('meals');

  const [showMealsDialog, setShowMealsDialog] = useState(false);
  const [showRecipesDialog, setShowRecipesDialog] = useState(false);

  const tabs: { key: NutritionTab; label: string }[] = [
    { key: 'meals', label: t.tracking.nutrition },
    { key: 'recipes', label: t.recipes.title },
    { key: 'history', label: language === 'de' ? 'Historie' : 'History' },
  ];

  const handleAddAction = () => {
    switch (activeTab) {
      case 'meals': setShowMealsDialog(true); break;
      case 'recipes': setShowRecipesDialog(true); break;
      // history tab has no add action
    }
  };

  return (
    <PageShell
      title={t.tracking.nutrition}
      actions={
        activeTab !== 'history' ? (
          <button
            onClick={handleAddAction}
            className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : undefined
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

      {/* Tab Content — each tab wrapped in error boundary for isolation */}
      {activeTab === 'meals' && (
        <ComponentErrorBoundary label="MealsTabContent" language={language as 'de' | 'en'}>
          <MealsTabContent
            showAddDialog={showMealsDialog}
            onOpenAddDialog={() => setShowMealsDialog(true)}
            onCloseAddDialog={() => setShowMealsDialog(false)}
          />
        </ComponentErrorBoundary>
      )}
      {activeTab === 'recipes' && (
        <ComponentErrorBoundary label="RecipesTabContent" language={language as 'de' | 'en'}>
          <RecipesTabContent
            showAddDialog={showRecipesDialog}
            onOpenAddDialog={() => setShowRecipesDialog(true)}
            onCloseAddDialog={() => setShowRecipesDialog(false)}
          />
        </ComponentErrorBoundary>
      )}
      {activeTab === 'history' && (
        <ComponentErrorBoundary label="NutritionHistoryTab" language={language as 'de' | 'en'}>
          <NutritionHistoryTab />
        </ComponentErrorBoundary>
      )}
    </PageShell>
  );
}
