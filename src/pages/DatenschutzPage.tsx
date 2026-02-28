import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';
import { ArrowLeft, Shield } from 'lucide-react';

/**
 * Datenschutzerklaerung / Privacy Policy (DSGVO Art. 13/14)
 *
 * OEFFENTLICH zugaenglich (kein Login erforderlich).
 * Umfassende Informationen zu Datenverarbeitung gemaess DSGVO.
 *
 * Abschnitte:
 * 1. Verantwortlicher
 * 2. Uebersicht der Verarbeitungen
 * 3. Rechtsgrundlagen
 * 4. Gesundheitsdaten (Art. 9)
 * 5. KI-Verarbeitung
 * 6. Hosting & Speicherort
 * 7. Cookies & Local Storage
 * 8. Drittdienste
 * 9. Betroffenenrechte
 * 10. Aenderungen
 */
export function DatenschutzPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t.privacy.title}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {t.privacy.lastUpdated}: 28.02.2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">

          {/* 1. Verantwortlicher */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              1. {t.privacy.controllerTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-1">
              <p className="font-medium">Timo Koch</p>
              <p>{t.legal.address}</p>
              <p>
                <span className="text-gray-500">{t.legal.email}: </span>
                <a href="mailto:datenschutz@fudda.de" className="text-teal-600 hover:underline">datenschutz@fudda.de</a>
              </p>
            </div>
          </section>

          {/* 2. Uebersicht */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              2. {t.privacy.overviewTitle}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {t.privacy.overviewText}
            </p>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>{t.privacy.dataTypeAccount}</li>
              <li>{t.privacy.dataTypeHealth}</li>
              <li>{t.privacy.dataTypeNutrition}</li>
              <li>{t.privacy.dataTypeTraining}</li>
              <li>{t.privacy.dataTypeSubstances}</li>
              <li>{t.privacy.dataTypeMedical}</li>
            </ul>
          </section>

          {/* 3. Rechtsgrundlagen */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              3. {t.privacy.legalBasisTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-2 leading-relaxed">
              <p><strong>{t.privacy.legalBasisConsent}:</strong> {t.privacy.legalBasisConsentText}</p>
              <p><strong>{t.privacy.legalBasisContract}:</strong> {t.privacy.legalBasisContractText}</p>
              <p><strong>{t.privacy.legalBasisLegitimate}:</strong> {t.privacy.legalBasisLegitimateText}</p>
            </div>
          </section>

          {/* 4. Gesundheitsdaten (Art. 9 DSGVO) */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">
              4. {t.privacy.healthDataTitle}
            </h2>
            <div className="text-amber-800 text-sm space-y-2 leading-relaxed">
              <p>{t.privacy.healthDataText}</p>
              <p><strong>{t.privacy.healthDataLegal}:</strong> {t.privacy.healthDataLegalText}</p>
              <p>{t.privacy.healthDataCategories}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t.privacy.healthCatBody}</li>
                <li>{t.privacy.healthCatBlood}</li>
                <li>{t.privacy.healthCatAllergies}</li>
                <li>{t.privacy.healthCatMenstruation}</li>
                <li>{t.privacy.healthCatSubstances}</li>
              </ul>
            </div>
          </section>

          {/* 5. KI-Verarbeitung */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              5. {t.privacy.aiProcessingTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-2 leading-relaxed">
              <p>{t.privacy.aiProcessingText}</p>
              <p><strong>{t.privacy.aiProvider}:</strong> {t.privacy.aiProviderText}</p>
              <p><strong>{t.privacy.aiDataMinimization}:</strong> {t.privacy.aiDataMinimizationText}</p>
              <p><strong>{t.privacy.aiNoTraining}:</strong> {t.privacy.aiNoTrainingText}</p>
            </div>
          </section>

          {/* 6. Hosting & Speicherort */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              6. {t.privacy.hostingTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-2 leading-relaxed">
              <p>{t.privacy.hostingText}</p>
              <p><strong>{t.privacy.hostingLocation}:</strong> {t.privacy.hostingLocationText}</p>
              <p><strong>{t.privacy.hostingProvider}:</strong> {t.privacy.hostingProviderText}</p>
              <p><strong>{t.privacy.hostingEncryption}:</strong> {t.privacy.hostingEncryptionText}</p>
            </div>
          </section>

          {/* 7. Cookies & Local Storage */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              7. {t.privacy.cookiesTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-2 leading-relaxed">
              <p>{t.privacy.cookiesText}</p>
              <p><strong>{t.privacy.cookiesEssential}:</strong> {t.privacy.cookiesEssentialText}</p>
              <p>{t.privacy.cookiesNoTracking}</p>
            </div>
          </section>

          {/* 8. Drittdienste */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              8. {t.privacy.thirdPartyTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-3 leading-relaxed">
              <div>
                <p className="font-medium">{t.privacy.thirdPartyOpenAI}</p>
                <p>{t.privacy.thirdPartyOpenAIText}</p>
              </div>
              <div>
                <p className="font-medium">{t.privacy.thirdPartyYouTube}</p>
                <p>{t.privacy.thirdPartyYouTubeText}</p>
              </div>
              <div>
                <p className="font-medium">{t.privacy.thirdPartySpotify}</p>
                <p>{t.privacy.thirdPartySpotifyText}</p>
              </div>
              <div>
                <p className="font-medium">{t.privacy.thirdPartyResend}</p>
                <p>{t.privacy.thirdPartyResendText}</p>
              </div>
            </div>
          </section>

          {/* 9. Betroffenenrechte */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              9. {t.privacy.rightsTitle}
            </h2>
            <div className="text-gray-700 text-sm space-y-2 leading-relaxed">
              <p>{t.privacy.rightsIntro}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>{t.privacy.rightAccess}</strong> — {t.privacy.rightAccessText}</li>
                <li><strong>{t.privacy.rightRectification}</strong> — {t.privacy.rightRectificationText}</li>
                <li><strong>{t.privacy.rightErasure}</strong> — {t.privacy.rightErasureText}</li>
                <li><strong>{t.privacy.rightRestriction}</strong> — {t.privacy.rightRestrictionText}</li>
                <li><strong>{t.privacy.rightPortability}</strong> — {t.privacy.rightPortabilityText}</li>
                <li><strong>{t.privacy.rightObjection}</strong> — {t.privacy.rightObjectionText}</li>
                <li><strong>{t.privacy.rightWithdraw}</strong> — {t.privacy.rightWithdrawText}</li>
              </ul>
              <p className="mt-3">{t.privacy.rightsAuthority}</p>
            </div>
          </section>

          {/* 10. Aenderungen */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              10. {t.privacy.changesTitle}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {t.privacy.changesText}
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
          <Link to="/impressum" className="hover:text-teal-600">
            {t.legal.impressumTitle}
          </Link>
          <span>|</span>
          <Link to="/login" className="hover:text-teal-600">
            {t.legal.backToApp}
          </Link>
        </div>

        {/* App Info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          {APP_NAME} &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
