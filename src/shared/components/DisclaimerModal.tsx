import { useState } from 'react';
import { ShieldAlert, Heart, Pill, Activity, Database, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
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

/**
 * ConsentCheckbox — eine einzelne granulare Einwilligung mit Label.
 * DSGVO-konform: Jede Einwilligung einzeln und freiwillig.
 */
function ConsentCheckbox({
  checked,
  onChange,
  label,
  sublabel,
  required = true,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  sublabel?: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl border border-gray-200 hover:border-teal-300 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
        required={required}
      />
      <div>
        <span className="text-xs font-medium text-gray-800 leading-relaxed">
          {label}
        </span>
        {sublabel && (
          <span className="block text-[10px] text-gray-500 mt-0.5">{sublabel}</span>
        )}
      </div>
    </label>
  );
}

export function DisclaimerModal({ onAccepted, readOnly = false, onClose }: DisclaimerModalProps) {
  const { t } = useTranslation();

  // Legacy single checkbox (fuer ReadOnly-Modus)
  const [checked, setChecked] = useState(false);

  // Granulare Einwilligungen (DSGVO E.1.3)
  const [consentHealthData, setConsentHealthData] = useState(false);
  const [consentAiProcessing, setConsentAiProcessing] = useState(false);
  const [consentThirdCountry, setConsentThirdCountry] = useState(false);

  const [saving, setSaving] = useState(false);

  const allConsentsGranted = checked && consentHealthData && consentAiProcessing && consentThirdCountry;

  const handleAccept = async () => {
    if (!allConsentsGranted || saving) return;
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

        {/* Content — Informative Sections */}
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

        {/* Footer — Consent Checkboxes + Accept (only in acceptance mode) */}
        {!readOnly && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {/* Granulare Einwilligungen */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t.disclaimer.consentTitle}
              </p>

              {/* 1. Haftungshinweise gelesen (Legacy) */}
              <ConsentCheckbox
                checked={checked}
                onChange={setChecked}
                label={t.disclaimer.checkboxLabel}
              />

              {/* 2. Gesundheitsdaten (Art. 9 DSGVO) */}
              <ConsentCheckbox
                checked={consentHealthData}
                onChange={setConsentHealthData}
                label={t.disclaimer.consentHealthData}
                sublabel={t.disclaimer.consentHealthDataSub}
              />

              {/* 3. KI-Verarbeitung */}
              <ConsentCheckbox
                checked={consentAiProcessing}
                onChange={setConsentAiProcessing}
                label={t.disclaimer.consentAiProcessing}
                sublabel={t.disclaimer.consentAiProcessingSub}
              />

              {/* 4. Drittlandtransfer */}
              <ConsentCheckbox
                checked={consentThirdCountry}
                onChange={setConsentThirdCountry}
                label={t.disclaimer.consentThirdCountry}
                sublabel={t.disclaimer.consentThirdCountrySub}
              />
            </div>

            {/* Link zu Datenschutzerklaerung */}
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
              <LinkIcon className="h-3 w-3" />
              <Link to="/datenschutz" target="_blank" className="hover:text-teal-600 underline">
                {t.legal.privacyPolicy}
              </Link>
              <span className="mx-1">|</span>
              <Link to="/impressum" target="_blank" className="hover:text-teal-600 underline">
                {t.legal.impressumTitle}
              </Link>
            </div>

            {/* Accept Button */}
            <button
              onClick={handleAccept}
              disabled={!allConsentsGranted || saving}
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
