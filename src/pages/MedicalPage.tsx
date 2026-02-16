import { Heart } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

export function MedicalPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t.medical.title}>
      <div className="space-y-4">
        {/* Blood Pressure Section Placeholder */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{t.medical.bloodPressure}</h3>
          <p className="text-sm text-gray-400">Phase 3b</p>
        </div>

        {/* Substances Section Placeholder */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">{t.medical.substances}</h3>
          <p className="text-sm text-gray-400">Phase 3b</p>
        </div>

        <div className="text-center py-8">
          <Heart className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">
            Medizin-Tracking wird in Phase 3b implementiert
          </p>
        </div>
      </div>
    </PageShell>
  );
}
