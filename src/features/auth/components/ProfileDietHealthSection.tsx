/**
 * ProfileDietHealthSection — Dietary preferences, allergies, health restrictions,
 * breastfeeding + cycle tracking toggles. Extracted from ProfilePage (v14.20 / P1-7)
 * so the parent stays readable; state still lives in ProfilePage and is passed in.
 *
 * Pure presentational: every value comes in via props, every change goes out
 * via callbacks. No data fetching, no autosave logic here.
 */

import type { Gender } from '../../../types/health';

interface ProfileDietHealthSectionProps {
  language: 'de' | 'en' | string;
  gender: Gender;
  dietaryPreferences: string[];
  allergies: string[];
  healthRestrictions: string[];
  isBreastfeeding: boolean;
  cycleTrackingEnabled: boolean;
  onDietaryPreferencesChange: (next: string[]) => void;
  onAllergiesChange: (next: string[]) => void;
  onHealthRestrictionsChange: (next: string[]) => void;
  onBreastfeedingToggle: () => void;
  onCycleTrackingToggle: () => void;
}

const DIETARY_OPTIONS = [
  { value: 'omnivore', de: 'Mischkost', en: 'Omnivore' },
  { value: 'vegetarian', de: 'Vegetarisch', en: 'Vegetarian' },
  { value: 'vegan', de: 'Vegan', en: 'Vegan' },
  { value: 'pescatarian', de: 'Pescatarisch', en: 'Pescatarian' },
  { value: 'keto', de: 'Ketogen', en: 'Ketogenic' },
  { value: 'paleo', de: 'Paleo', en: 'Paleo' },
  { value: 'halal', de: 'Halal', en: 'Halal' },
  { value: 'kosher', de: 'Koscher', en: 'Kosher' },
  { value: 'lactose_free', de: 'Laktosefrei', en: 'Lactose-free' },
  { value: 'gluten_free', de: 'Glutenfrei', en: 'Gluten-free' },
] as const;

const ALLERGY_OPTIONS = [
  { value: 'nuts', de: 'Nüsse', en: 'Nuts' },
  { value: 'peanuts', de: 'Erdnüsse', en: 'Peanuts' },
  { value: 'gluten', de: 'Gluten', en: 'Gluten' },
  { value: 'lactose', de: 'Laktose', en: 'Lactose' },
  { value: 'milk_protein', de: 'Milcheiweiß', en: 'Milk Protein' },
  { value: 'shellfish', de: 'Schalentiere', en: 'Shellfish' },
  { value: 'mollusks', de: 'Weichtiere', en: 'Mollusks' },
  { value: 'eggs', de: 'Eier', en: 'Eggs' },
  { value: 'soy', de: 'Soja', en: 'Soy' },
  { value: 'fructose', de: 'Fruktose', en: 'Fructose' },
  { value: 'histamine', de: 'Histamin', en: 'Histamine' },
  { value: 'celery', de: 'Sellerie', en: 'Celery' },
  { value: 'mustard', de: 'Senf', en: 'Mustard' },
  { value: 'sesame', de: 'Sesam', en: 'Sesame' },
  { value: 'lupins', de: 'Lupinen', en: 'Lupins' },
  { value: 'sulfites', de: 'Sulfite', en: 'Sulfites' },
  { value: 'wheat', de: 'Weizen', en: 'Wheat' },
] as const;

const HEALTH_OPTIONS = [
  { value: 'back', de: 'Rücken', en: 'Back' },
  { value: 'shoulder', de: 'Schulter', en: 'Shoulder' },
  { value: 'knee', de: 'Knie', en: 'Knee' },
  { value: 'hip', de: 'Hüfte', en: 'Hip' },
  { value: 'elbow', de: 'Ellbogen', en: 'Elbow' },
  { value: 'wrist', de: 'Handgelenk', en: 'Wrist' },
  { value: 'ankle', de: 'Sprunggelenk', en: 'Ankle' },
  { value: 'neck', de: 'Nacken', en: 'Neck' },
  { value: 'disc', de: 'Bandscheibe', en: 'Disc' },
  { value: 'heart', de: 'Herz', en: 'Heart' },
  { value: 'hypertension', de: 'Bluthochdruck', en: 'Hypertension' },
  { value: 'diabetes_type1', de: 'Diabetes Typ 1', en: 'Diabetes Type 1' },
  { value: 'diabetes_type2', de: 'Diabetes Typ 2', en: 'Diabetes Type 2' },
  { value: 'asthma', de: 'Asthma', en: 'Asthma' },
  { value: 'thyroid', de: 'Schilddrüse', en: 'Thyroid' },
  { value: 'osteoporosis', de: 'Osteoporose', en: 'Osteoporosis' },
  { value: 'diastasis_recti', de: 'Rektusdiastase', en: 'Diastasis Recti' },
] as const;

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

export function ProfileDietHealthSection(props: ProfileDietHealthSectionProps) {
  const {
    language, gender,
    dietaryPreferences, allergies, healthRestrictions,
    isBreastfeeding, cycleTrackingEnabled,
    onDietaryPreferencesChange, onAllergiesChange, onHealthRestrictionsChange,
    onBreastfeedingToggle, onCycleTrackingToggle,
  } = props;
  const isDE = language === 'de';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">
        {isDE ? 'Ernährung & Gesundheit' : 'Diet & Health'}
      </h3>

      <div className="space-y-4">
        {/* Dietary Preferences */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            {isDE ? 'Ernährungsform' : 'Dietary Preferences'}
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => {
              const isSelected = dietaryPreferences.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDietaryPreferencesChange(toggleValue(dietaryPreferences, opt.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-theme-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDE ? opt.de : opt.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            {isDE ? 'Allergien & Unverträglichkeiten' : 'Allergies & Intolerances'}
          </label>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((opt) => {
              const isSelected = allergies.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onAllergiesChange(toggleValue(allergies, opt.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDE ? opt.de : opt.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Health Restrictions */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            {isDE ? 'Gesundheitliche Einschränkungen' : 'Health Restrictions'}
          </label>
          <div className="flex flex-wrap gap-2">
            {HEALTH_OPTIONS.map((opt) => {
              const isSelected = healthRestrictions.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onHealthRestrictionsChange(toggleValue(healthRestrictions, opt.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDE ? opt.de : opt.en}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {isDE
              ? 'Der KI-Assistent berücksichtigt diese Einschränkungen bei Trainingsempfehlungen.'
              : 'The AI assistant considers these restrictions when recommending exercises.'}
          </p>
        </div>

        {/* Breastfeeding Toggle — only for female */}
        {gender === 'female' && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {isDE ? '🤱 Ich stille aktuell' : '🤱 Currently breastfeeding'}
                </label>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isDE
                    ? '+400 kcal/Tag Kalorienzuschlag (Dewey et al. 2003)'
                    : '+400 kcal/day calorie supplement (Dewey et al. 2003)'}
                </p>
              </div>
              <button
                type="button"
                onClick={onBreastfeedingToggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isBreastfeeding ? 'bg-pink-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isBreastfeeding ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {isBreastfeeding && (
              <div className="mt-2 p-2 bg-pink-50 rounded-lg">
                <p className="text-[10px] text-pink-700">
                  {isDE
                    ? '✅ Stillzeit-Zuschlag aktiv. Dein Kalorienziel wird automatisch um +400 kcal erhoeht wenn du "Ziele berechnen" nutzt.'
                    : '✅ Breastfeeding supplement active. Your calorie goal will automatically increase by +400 kcal when using "Calculate Goals".'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cycle Tracking Toggle — only for female/other */}
        {(gender === 'female' || gender === 'other') && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {isDE ? '🩸 Zyklus-Tracking' : '🩸 Cycle Tracking'}
                </label>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isDE
                    ? 'Menstruationszyklus tracken, Training & Ernaehrung anpassen'
                    : 'Track menstrual cycle, adapt training & nutrition'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCycleTrackingToggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  cycleTrackingEnabled ? 'bg-rose-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  cycleTrackingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {cycleTrackingEnabled && (
              <div className="mt-2 p-2 bg-rose-50 rounded-lg">
                <p className="text-[10px] text-rose-700">
                  {isDE
                    ? '✅ Zyklus-Tracking aktiv. Dein KI-Buddy beruecksichtigt die Zyklusphase bei Training und Ernaehrung. Deine Daten bleiben in Deutschland (DSGVO Art. 9).'
                    : '✅ Cycle tracking active. Your AI buddy considers your cycle phase for training and nutrition advice. Your data stays in Germany (GDPR Art. 9).'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
