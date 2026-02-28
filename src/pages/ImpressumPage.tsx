import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';
import { ArrowLeft, Scale } from 'lucide-react';

/**
 * Impressum / Imprint Page (§ 5 DDG, ehemals TMG)
 *
 * Pflichtangaben fuer deutsche Websites/Apps.
 * OEFFENTLICH zugaenglich (kein Login erforderlich).
 *
 * WICHTIG: Platzhalter [DATEN] muessen vom Betreiber ausgefuellt werden!
 */
export function ImpressumPage() {
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
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t.legal.impressumTitle}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {t.legal.impressumSubtitle}
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

          {/* Angaben gemaess § 5 DDG */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.providerInfo}
            </h2>
            <div className="text-gray-700 space-y-1">
              <p className="font-medium">Timo Koch</p>
              <p>{t.legal.address}</p>
              <p className="mt-2">
                <span className="text-gray-500">{t.legal.email}: </span>
                <a href="mailto:info@fudda.de" className="text-teal-600 hover:underline">info@fudda.de</a>
              </p>
            </div>
          </section>

          {/* Verantwortlich fuer den Inhalt */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.editorialResponsibility}
            </h2>
            <div className="text-gray-700">
              <p>Timo Koch</p>
              <p className="text-sm text-gray-500 mt-1">{t.legal.editorialNote}</p>
            </div>
          </section>

          {/* EU-Streitschlichtung */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.disputeResolution}
            </h2>
            <div className="text-gray-700 space-y-2 text-sm">
              <p>{t.legal.disputeText}</p>
              <p>
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline break-all"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>{t.legal.disputeParticipation}</p>
            </div>
          </section>

          {/* Haftung fuer Inhalte */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.contentLiability}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {t.legal.contentLiabilityText}
            </p>
          </section>

          {/* Haftung fuer Links */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.linkLiability}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {t.legal.linkLiabilityText}
            </p>
          </section>

          {/* Urheberrecht */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t.legal.copyright}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {t.legal.copyrightText}
            </p>
          </section>

          {/* Medizinischer Hinweis */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">
              {t.legal.medicalDisclaimer}
            </h2>
            <p className="text-amber-800 text-sm leading-relaxed">
              {t.legal.medicalDisclaimerText}
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
          <Link to="/datenschutz" className="hover:text-teal-600">
            {t.legal.privacyPolicy}
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
