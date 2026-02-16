import { Activity } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

export function BodyPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t.body.title}>
      <div className="text-center py-16">
        <Activity className="h-16 w-16 mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">{t.common.noData}</p>
        <p className="text-sm text-gray-400 mt-2">
          Körperwerte-Tracking wird in Phase 3b implementiert
        </p>
      </div>
    </PageShell>
  );
}
