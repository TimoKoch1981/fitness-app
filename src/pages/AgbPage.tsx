/**
 * AgbPage — Allgemeine Geschaeftsbedingungen / Terms of Service.
 *
 * STATUS: DRAFT — Anwalts-Review ausstehend (Phase 3 Sprint 3.4).
 * Inhalt basiert auf typischen SaaS-ToS-Templates + DSGVO-spezifischen
 * Anforderungen fuer Health-Daten (Art. 9). Vor Production-Use durch
 * Fachanwalt fuer IT-/Datenschutzrecht pruefen lassen.
 *
 * Pricing-Page sollte hier verlinkt sein. Account-Loeschung wird gesondert
 * im Profil-Menue umgesetzt (DSGVO Art. 17).
 */

import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';

export function AgbPage() {
  const { language } = useTranslation();
  const isDE = language === 'de';

  if (!isDE) {
    return (
      <PageShell title="Terms of Service">
        <div className="prose prose-sm max-w-3xl mx-auto px-4 py-8 text-theme-ink-2">
          <p className="text-xs text-theme-ink-3 italic mb-6">
            Status: Draft. Final version pending legal review.
            German version is binding per German law.
          </p>
          <p>
            English translation will follow. For now, please refer to the German version.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="AGB">
      <div className="prose prose-sm max-w-3xl mx-auto px-4 py-8 text-theme-ink-2 space-y-4">
        <p className="text-xs text-theme-ink-3 italic">
          Status: ENTWURF. Finalfassung nach Rechtspruefung. Stand: 2026-05-16.
        </p>

        <h1 className="font-theme-display text-2xl font-semibold text-theme-ink">
          Allgemeine Geschaeftsbedingungen
        </h1>

        <h2 className="font-semibold text-theme-ink mt-6">§ 1 Geltungsbereich</h2>
        <p>
          Diese AGB gelten fuer die Nutzung der FitBuddy-Applikation (fudda.de),
          betrieben durch [Anbieter — siehe Impressum]. Mit Registrierung
          akzeptiert der Nutzer diese AGB.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 2 Leistungsbeschreibung</h2>
        <p>
          FitBuddy ist eine Health-&amp;-Fitness-Tracking-Plattform. Sie umfasst
          KI-gestuetzte Empfehlungen, Mahlzeiten-/Trainings-Tracking, sowie
          Auswertungen. <strong>FitBuddy ist KEIN Medizinprodukt</strong> und
          ersetzt keine aerztliche Beratung. Empfehlungen sind nicht-bindend
          und ohne Heilanspruch.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 3 Tarife &amp; Zahlung</h2>
        <ul className="list-disc pl-5">
          <li><strong>Free:</strong> kostenlos, begrenzte KI-Nutzung.</li>
          <li><strong>Pro:</strong> 9,99 EUR/Monat inkl. MwSt., monatlich kuendbar.</li>
          <li><strong>Elite:</strong> 29,99 EUR/Monat inkl. MwSt., monatlich kuendbar.</li>
        </ul>
        <p>
          Zahlungsabwicklung ueber Stripe (Stripe Payments Europe Ltd., Irland).
          Es gilt das gesetzliche Widerrufsrecht (14 Tage) bei erstmaligem
          Vertragsabschluss, soweit keine Sofort-Nutzung gewuenscht wird.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 4 Vertragslaufzeit &amp; Kuendigung</h2>
        <p>
          Vertraege laufen monatlich. Kuendigung jederzeit ueber das
          Customer-Portal (Stripe). Es entstehen keine Kuendigungsgebuehren.
          Nach Kuendigung bleibt der Pro/Elite-Zugang bis zum Ende des bezahlten
          Zeitraums aktiv.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 5 Datenschutz</h2>
        <p>
          Die Verarbeitung personenbezogener Daten — insbesondere
          Gesundheitsdaten i.S.d. Art. 9 DSGVO — erfolgt entsprechend unserer{' '}
          <a href="/datenschutz" className="underline text-theme-primary">Datenschutzerklaerung</a>.
          Daten werden in der EU (Hetzner, Deutschland) gehostet.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 6 Haftungsausschluss</h2>
        <p>
          FitBuddy haftet nicht fuer:
        </p>
        <ul className="list-disc pl-5">
          <li>medizinische Konsequenzen aus eigenverantwortlicher Nutzung der Empfehlungen</li>
          <li>Schaeden durch fehlerhafte KI-Antworten — KI-Output ist als Anregung zu verstehen, nicht als Beratung</li>
          <li>Daten-Verlust durch hoehere Gewalt (jedoch Daily-Offsite-Backup vorhanden)</li>
        </ul>
        <p>
          Die Haftung fuer leichte Fahrlaessigkeit ist ausgeschlossen, soweit
          keine Kardinalpflichten betroffen sind.
        </p>

        <h2 className="font-semibold text-theme-ink mt-6">§ 7 Recht der Nutzer</h2>
        <ul className="list-disc pl-5">
          <li>Auskunftsrecht (Art. 15 DSGVO) — auf Anfrage via Profil-Menue</li>
          <li>Datenexport (Art. 20 DSGVO) — Self-Service im Profil</li>
          <li>Account-Loeschung (Art. 17 DSGVO) — Self-Service im Profil</li>
          <li>Widerruf der Einwilligung (Art. 7 DSGVO) — jederzeit</li>
        </ul>

        <h2 className="font-semibold text-theme-ink mt-6">§ 8 Sonstiges</h2>
        <p>
          Es gilt deutsches Recht. Gerichtsstand: [Sitz des Anbieters]. Bei
          Streitigkeiten ist der Anbieter zur Teilnahme an einem
          Streitbeilegungs-verfahren vor einer Verbraucherschlichtungsstelle
          nicht verpflichtet und nicht bereit.
        </p>
        <p>
          Salvatorische Klausel: Sollte eine Bestimmung dieser AGB unwirksam
          sein, bleibt der Rest unberuehrt.
        </p>

        <p className="text-xs text-theme-ink-3 mt-8 italic">
          Stand: 2026-05-16 — Version 1.0-draft. Bei Rueckfragen:{' '}
          <a href="mailto:legal@fudda.de" className="underline">legal@fudda.de</a>.
        </p>
      </div>
    </PageShell>
  );
}
