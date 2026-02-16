import { LayoutDashboard } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t.dashboard.title}>
      <div className="space-y-4">
        {/* Placeholder stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.dashboard.calories, value: '0', goal: '2000', unit: 'kcal', color: 'teal' },
            { label: t.dashboard.protein, value: '0', goal: '150', unit: 'g', color: 'emerald' },
            { label: t.dashboard.carbs, value: '0', goal: '250', unit: 'g', color: 'blue' },
            { label: t.dashboard.fat, value: '0', goal: '65', unit: 'g', color: 'amber' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
                <span className="text-sm font-normal text-gray-400 ml-1">{stat.unit}</span>
              </p>
              <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                <div className="bg-teal-500 rounded-full h-1.5 w-0" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {t.dashboard.goal}: {stat.goal} {stat.unit}
              </p>
            </div>
          ))}
        </div>

        {/* Placeholder info */}
        <div className="text-center py-8">
          <LayoutDashboard className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            Dashboard wird in Phase 3b mit echten Daten befüllt
          </p>
        </div>
      </div>
    </PageShell>
  );
}
