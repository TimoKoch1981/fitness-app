/**
 * TrainingModeSelector — 3-card selection for Standard/Power/Power+ mode.
 * Shown on the ProfilePage. Power+ requires a one-time disclaimer acceptance.
 *
 * @version 1.0.0
 */

import { useState } from 'react';
import { Dumbbell, Zap, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { TrainingMode } from '../../types/health';

interface TrainingModeSelectorProps {
  value: TrainingMode;
  onChange: (mode: TrainingMode) => void;
  powerPlusAccepted: boolean;
  onAcceptPowerPlus: () => void;
}

const MODE_CONFIG: Record<TrainingMode, {
  icon: typeof Dumbbell;
  color: string;
  bgActive: string;
  borderActive: string;
}> = {
  standard: {
    icon: Dumbbell,
    color: 'text-gray-600',
    bgActive: 'bg-gray-50',
    borderActive: 'border-gray-400',
  },
  power: {
    icon: Zap,
    color: 'text-amber-600',
    bgActive: 'bg-amber-50',
    borderActive: 'border-amber-400',
  },
  power_plus: {
    icon: Zap,
    color: 'text-red-600',
    bgActive: 'bg-red-50',
    borderActive: 'border-red-400',
  },
};

export function TrainingModeSelector({
  value,
  onChange,
  powerPlusAccepted,
  onAcceptPowerPlus,
}: TrainingModeSelectorProps) {
  const { t } = useTranslation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleSelect = (mode: TrainingMode) => {
    if (mode === 'power_plus' && !powerPlusAccepted) {
      setShowDisclaimer(true);
      return;
    }
    onChange(mode);
  };

  const handleAcceptDisclaimer = () => {
    onAcceptPowerPlus();
    onChange('power_plus');
    setShowDisclaimer(false);
  };

  const modes: { key: TrainingMode; label: string; desc: string }[] = [
    {
      key: 'standard',
      label: 'Standard',
      desc: t.trainingMode?.standardDesc ?? 'Allgemeines Fitness-Tracking fuer jeden Trainingsstand',
    },
    {
      key: 'power',
      label: 'Power',
      desc: t.trainingMode?.powerDesc ?? 'Natural Bodybuilding — Wettkampf, Periodisierung, Peak Week',
    },
    {
      key: 'power_plus',
      label: 'Power+',
      desc: t.trainingMode?.powerPlusDesc ?? 'Enhanced Training — Substanz-Monitoring, Blutbild, Zyklen',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">
        {t.trainingMode?.title ?? 'Trainingsmodus'}
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        {t.trainingMode?.subtitle ?? 'Personalisierte Empfehlungen fuer deinen Trainingsansatz'}
      </p>

      <div className="space-y-2">
        {modes.map(({ key, label, desc }) => {
          const config = MODE_CONFIG[key];
          const Icon = config.icon;
          const isActive = value === key;

          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isActive
                  ? `${config.bgActive} ${config.borderActive}`
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${isActive ? config.bgActive : 'bg-gray-50'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? config.color : 'text-gray-400'}`} />
                  {key === 'power_plus' && (
                    <span className="text-[8px] font-bold text-red-500 block text-center -mt-0.5">+</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isActive ? config.color : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        key === 'power_plus' ? 'bg-red-100 text-red-700' :
                        key === 'power' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.trainingMode?.active ?? 'Aktiv'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 mt-2 leading-tight">
        {t.trainingMode?.hint ?? 'Der Modus beeinflusst KI-Empfehlungen und sichtbare Features. Jederzeit aenderbar.'}
      </p>

      {/* Power+ Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h4 className="font-bold text-gray-900">Power+ Modus</h4>
            </div>
            <div className="text-sm text-gray-600 space-y-2 mb-4">
              <p>
                {t.trainingMode?.disclaimerText1 ??
                  'Dieser Modus aktiviert erweiterte Features fuer Substanz-Monitoring, Blutbild-Analyse und Zyklus-Tracking.'}
              </p>
              <p className="font-medium text-gray-800">
                {t.trainingMode?.disclaimerText2 ??
                  'FitBuddy ist KEINE medizinische Beratung. Alle Informationen dienen der Schadensminimierung und ersetzen keinen Arzt.'}
              </p>
              <p>
                {t.trainingMode?.disclaimerText3 ??
                  'Substanz-Empfehlungen, Dosierungen und Zyklen sind rein informativ — Entscheidungen liegen in deiner Verantwortung.'}
              </p>
            </div>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                id="power-plus-accept"
                className="mt-1 rounded border-gray-300 text-red-500 focus:ring-red-500"
                onChange={(e) => {
                  const btn = document.getElementById('power-plus-confirm-btn') as HTMLButtonElement;
                  if (btn) btn.disabled = !e.target.checked;
                }}
              />
              <span className="text-xs text-gray-600">
                {t.trainingMode?.disclaimerCheckbox ??
                  'Ich verstehe, dass FitBuddy keine medizinische Beratung ist und Substanz-Entscheidungen in meiner Verantwortung liegen.'}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t.common?.cancel ?? 'Abbrechen'}
              </button>
              <button
                id="power-plus-confirm-btn"
                disabled
                onClick={handleAcceptDisclaimer}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.trainingMode?.activate ?? 'Aktivieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
