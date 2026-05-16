/**
 * PricingPage — Stripe-Checkout-Einstieg.
 *
 * Skelett-Status: UI rendert die 3 Tiers. Stripe-Checkout-Redirect wartet
 * auf User-Action (Stripe-Account, Price-IDs in env, Edge Function
 * stripe-checkout zum Erstellen einer Checkout-Session).
 */

import { useState } from 'react';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useSubscription, type PlanTier } from '../features/billing/hooks/useSubscription';
import { useAuth } from '../app/providers/AuthProvider';

interface PricingTier {
  id: PlanTier;
  name: string;
  priceEUR: number;
  badge?: string;
  icon: typeof Zap;
  features: { de: string; en: string }[];
}

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceEUR: 0,
    icon: Zap,
    features: [
      { de: 'Tracking: Mahlzeiten, Workouts, Gewicht', en: 'Tracking: meals, workouts, weight' },
      { de: '~50 KI-Chats/Monat', en: '~50 AI chats/month' },
      { de: 'Basis-Charts', en: 'Basic charts' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceEUR: 9.99,
    badge: 'Beliebt',
    icon: Crown,
    features: [
      { de: 'Alles aus Free', en: 'Everything in Free' },
      { de: '~500 KI-Chats/Monat', en: '~500 AI chats/month' },
      { de: 'PDF-Export fuer Arzt', en: 'PDF export for doctor' },
      { de: 'Multi-Device-Sync', en: 'Multi-device sync' },
      { de: 'Erweiterte Charts + Vorhersagen', en: 'Advanced charts + forecasts' },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    priceEUR: 29.99,
    icon: Shield,
    features: [
      { de: 'Alles aus Pro', en: 'Everything in Pro' },
      { de: 'Unbegrenzte KI-Chats', en: 'Unlimited AI chats' },
      { de: 'Power+ Modus (PED-Tracking)', en: 'Power+ mode (PED tracking)' },
      { de: 'Priority-Support', en: 'Priority support' },
      { de: 'Beta-Features', en: 'Beta features' },
    ],
  },
];

export function PricingPage() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { user } = useAuth();
  const { tier: currentTier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

  const handleCheckout = async (tier: PlanTier) => {
    if (!user) {
      window.location.href = '/login?next=/pricing';
      return;
    }
    if (tier === 'free') return;
    if (tier === currentTier) {
      // Already subscribed → redirect to Stripe Customer Portal
      window.alert(isDE
        ? 'Du bist bereits auf diesem Plan. Customer-Portal-Link folgt nach Stripe-Setup.'
        : 'You are already on this plan. Customer portal link coming after Stripe setup.');
      return;
    }

    setLoadingTier(tier);
    try {
      // TODO Phase 3 Sprint 3.2: Call stripe-checkout Edge Function to create Checkout Session
      // const { data } = await supabase.functions.invoke('stripe-checkout', {
      //   body: { tier, userId: user.id, returnUrl: window.location.origin + '/profile' },
      // });
      // window.location.href = data.checkout_url;
      window.alert(isDE
        ? 'Stripe-Checkout wird noch konfiguriert. Setup-Anleitung: docs/PHASE3_STRIPE_SETUP.md'
        : 'Stripe checkout being configured. Setup guide: docs/PHASE3_STRIPE_SETUP.md');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <PageShell title={isDE ? 'Preise' : 'Pricing'}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="font-theme-display text-3xl font-semibold text-theme-ink mb-2">
            {isDE ? 'Waehle deinen Plan' : 'Choose your plan'}
          </h1>
          <p className="text-sm text-theme-ink-2">
            {isDE
              ? 'Volle Funktionen 14 Tage gratis. Jederzeit kuendbar.'
              : 'Full features 14 days free. Cancel anytime.'}
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map(t => {
            const Icon = t.icon;
            const isCurrent = t.id === currentTier;
            const isHighlighted = t.badge != null;
            return (
              <div
                key={t.id}
                className={`relative rounded-theme-lg border p-6 ${
                  isHighlighted
                    ? 'border-theme-primary bg-theme-surface shadow-md'
                    : 'border-theme-line bg-theme-surface'
                }`}
              >
                {t.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-theme-primary px-3 py-1 text-xs font-medium text-theme-primary-on">
                    {t.badge}
                  </span>
                )}
                <Icon className="h-6 w-6 text-theme-primary mb-3" />
                <h2 className="font-theme-display text-2xl font-semibold text-theme-ink">
                  {t.name}
                </h2>
                <div className="mt-2 mb-4">
                  <span className="font-theme-display text-3xl font-semibold tabular-nums text-theme-ink">
                    {t.priceEUR === 0 ? (isDE ? 'Gratis' : 'Free') : `€${t.priceEUR.toFixed(2)}`}
                  </span>
                  {t.priceEUR > 0 && (
                    <span className="ml-1 text-sm text-theme-ink-3">
                      / {isDE ? 'Monat' : 'mo'}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-theme-ink-2">
                      <Check className="h-4 w-4 text-theme-primary flex-shrink-0 mt-0.5" />
                      <span>{isDE ? f.de : f.en}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleCheckout(t.id)}
                  disabled={loadingTier === t.id || isCurrent}
                  className={`w-full rounded-theme-md px-4 py-2.5 text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-theme-surface-2 text-theme-ink-3 cursor-default'
                      : isHighlighted
                        ? 'bg-theme-primary text-theme-primary-on hover:bg-theme-primary-2'
                        : 'border border-theme-line text-theme-ink hover:bg-theme-surface-2'
                  }`}
                >
                  {isCurrent
                    ? (isDE ? 'Aktueller Plan' : 'Current plan')
                    : loadingTier === t.id
                      ? (isDE ? 'Laedt...' : 'Loading...')
                      : t.priceEUR === 0
                        ? (isDE ? 'Starten' : 'Get started')
                        : (isDE ? 'Upgrade' : 'Upgrade')}
                </button>
              </div>
            );
          })}
        </div>

        <footer className="mt-8 text-center text-xs text-theme-ink-3">
          <p>
            {isDE
              ? 'Alle Preise inkl. MwSt. (DE). EU-Kunden sehen lokalen Mehrwertsteuersatz im Checkout.'
              : 'All prices incl. VAT (DE). EU customers see local VAT rate at checkout.'}
          </p>
          <p className="mt-2">
            <a href="/agb" className="underline hover:text-theme-primary">AGB</a>
            {' · '}
            <a href="/datenschutz" className="underline hover:text-theme-primary">Datenschutz</a>
            {' · '}
            <a href="/impressum" className="underline hover:text-theme-primary">Impressum</a>
          </p>
        </footer>
      </div>
    </PageShell>
  );
}
