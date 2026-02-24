import { useState } from 'react';
import { ShieldAlert, Heart, Pill, Activity, Database, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface DisclaimerModalProps {
  onAccepted: () => void;
  readOnly?: boolean;
  onClose?: () => void;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

function Section({ icon, title, text }: SectionProps) {
  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="flex-shrink-0 mt-0.5 text-gray-500">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function DisclaimerModal({ onAccepted, readOnly = false, onClose }: DisclaimerModalProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!checked || saving) return;
    setSaving(true);
    onAccepted();
  };

  const iconSize = 'h-5 w-5';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 ${readOnly ? 'cursor-pointer' : ''}`}
        onClick={readOnly ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t.disclaimer.title}</h2>
              <p className="text-xs text-gray-500">{t.disclaimer.subtitle}</p>
            </div>
          </div>
          {readOnly && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              &times;
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          <Section
            icon={<Heart className={iconSize} />}
            title={t.disclaimer.medicalTitle}
            text={t.disclaimer.medicalText}
          />
          <Section
            icon={<Pill className={iconSize} />}
            title={t.disclaimer.substancesTitle}
            text={t.disclaimer.substancesText}
          />
          <Section
            icon={<Activity className={iconSize} />}
            title={t.disclaimer.bloodPressureTitle}
            text={t.disclaimer.bloodPressureText}
          />
          <Section
            icon={<Database className={iconSize} />}
            title={t.disclaimer.dataTitle}
            text={t.disclaimer.dataText}
          />
          <Section
            icon={<AlertTriangle className={iconSize} />}
            title={t.disclaimer.riskTitle}
            text={t.disclaimer.riskText}
          />
        </div>

        {/* Footer — only in acceptance mode */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                {t.disclaimer.checkboxLabel}
              </span>
            </label>

            {/* Accept Button */}
            <button
              onClick={handleAccept}
              disabled={!checked || saving}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-700 active:scale-[0.98]"
            >
              {saving ? t.common.loading : t.disclaimer.accept}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
