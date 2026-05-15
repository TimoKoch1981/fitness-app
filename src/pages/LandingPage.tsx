import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Brain, Dumbbell, Camera, ScanLine, BookOpen, Heart, ArrowRight, Shield, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n';
import { APP_NAME } from '../lib/constants';
import { LanguageSelector } from '../components/LanguageSelector';

/** Fade-in-up animation wrapper — triggers when element scrolls into view */
function FadeInSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURE_ICONS = [Brain, Dumbbell, Camera, ScanLine, BookOpen, Heart] as const;

export function LandingPage() {
  const { t } = useTranslation();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const featureKeys = [
    'aiNutrition',
    'workoutTracking',
    'progressPhotos',
    'barcodeScanner',
    'recipeDatabase',
    'medicalProtocol',
  ] as const;

  const stepKeys = ['register', 'track', 'optimize'] as const;

  return (
    // LandingPage nutzt Power Console als visuellen Erstkontakt — passt zum
    // Marketing-Hero-Charakter. Studio bekommt der Rest der App.
    <div data-surface-mode="console" className="min-h-screen bg-theme-bg text-theme-ink overflow-x-hidden">
      {/* Navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-theme-bg/80 backdrop-blur-md border-b border-theme-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-theme-primary rounded-theme-md flex items-center justify-center">
              <span className="text-sm font-bold text-theme-primary-on tracking-tight">FB</span>
            </div>
            <span className="text-lg font-semibold text-theme-ink font-theme-display tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/login"
              className="text-sm text-theme-ink-2 hover:text-theme-ink transition-colors px-3 py-1.5"
            >
              {t.auth.login}
            </Link>
            <Link
              to="/register"
              className="text-sm bg-theme-primary hover:bg-theme-primary-2 text-theme-primary-on font-medium px-4 py-1.5 rounded-theme-md transition-colors"
            >
              {t.auth.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Acid-Lime glow orbs (Power Console Akzent, sehr dezent) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-primary opacity-[0.06] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-theme-accent opacity-[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-theme-surface border border-theme-line rounded-full text-theme-primary text-sm mb-8">
              <Shield className="w-4 h-4" />
              {t.landing.dsgvoBadge}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 font-theme-display text-theme-ink">
              {t.landing.heroTitle}
            </h1>

            <p className="text-lg sm:text-xl text-theme-ink-2 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-theme-primary hover:bg-theme-primary-2 text-theme-primary-on font-semibold rounded-theme-md transition-colors text-lg"
              >
                {t.landing.ctaStart}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-theme-surface hover:bg-theme-surface-2 text-theme-ink font-medium rounded-theme-md transition-colors text-lg border border-theme-line"
              >
                {t.landing.ctaLearnMore}
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-theme-ink-3" />
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section ref={featuresRef} className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-theme-display tracking-tight text-theme-ink">
              {t.landing.featuresTitle}
            </h2>
            <p className="text-theme-ink-2 text-lg max-w-2xl mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, idx) => {
              const Icon = FEATURE_ICONS[idx];
              return (
                <FadeInSection key={key} delay={idx * 0.1}>
                  <div className="group bg-theme-surface border border-theme-line rounded-theme-lg p-6 hover:border-theme-primary transition-colors">
                    <div className="w-12 h-12 bg-theme-surface-2 border border-theme-line rounded-theme-md flex items-center justify-center mb-4 group-hover:border-theme-primary transition-colors">
                      <Icon className="w-6 h-6 text-theme-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-theme-ink">
                      {(t.landing as Record<string, string>)[`feature_${key}_title`]}
                    </h3>
                    <p className="text-theme-ink-2 text-sm leading-relaxed">
                      {(t.landing as Record<string, string>)[`feature_${key}_desc`]}
                    </p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 sm:py-28 bg-theme-surface/40">
        <div className="max-w-4xl mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-theme-display tracking-tight text-theme-ink">
              {t.landing.howItWorksTitle}
            </h2>
            <p className="text-theme-ink-2 text-lg">
              {t.landing.howItWorksSubtitle}
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepKeys.map((key, idx) => (
              <FadeInSection key={key} delay={idx * 0.15}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-theme-primary rounded-theme-md flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-theme-primary-on font-theme-numeric">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-theme-ink">
                    {(t.landing as Record<string, string>)[`step_${key}_title`]}
                  </h3>
                  <p className="text-theme-ink-2 leading-relaxed">
                    {(t.landing as Record<string, string>)[`step_${key}_desc`]}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-theme-display tracking-tight text-theme-ink">
              {t.landing.testimonialsTitle}
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([1, 2, 3] as const).map((num) => (
              <FadeInSection key={num} delay={num * 0.1}>
                <div className="bg-theme-surface border border-theme-line rounded-theme-lg p-6">
                  <div className="flex items-center gap-1 mb-4 text-theme-primary">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-theme-ink text-sm leading-relaxed mb-4 italic">
                    &ldquo;{(t.landing as Record<string, string>)[`testimonial_${num}_text`]}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-theme-surface-2 border border-theme-line rounded-full flex items-center justify-center text-sm font-bold text-theme-primary font-theme-numeric">
                      {(t.landing as Record<string, string>)[`testimonial_${num}_name`]?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-theme-ink">
                        {(t.landing as Record<string, string>)[`testimonial_${num}_name`]}
                      </p>
                      <p className="text-xs text-theme-ink-3">
                        {(t.landing as Record<string, string>)[`testimonial_${num}_role`]}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 sm:py-28 bg-theme-surface/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 font-theme-display tracking-tight text-theme-ink">
              {t.landing.finalCtaTitle}
            </h2>
            <p className="text-theme-ink-2 text-lg mb-10 max-w-xl mx-auto">
              {t.landing.finalCtaSubtitle}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-theme-primary hover:bg-theme-primary-2 text-theme-primary-on font-semibold rounded-theme-md transition-colors text-lg"
            >
              {t.landing.ctaStartFree}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-theme-line py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo + tagline */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-theme-primary rounded-theme-sm flex items-center justify-center">
                <span className="text-xs font-bold text-theme-primary-on tracking-tight">FB</span>
              </div>
              <div>
                <p className="font-semibold text-theme-ink">{APP_NAME}</p>
                <p className="text-xs text-theme-ink-3">{t.landing.footerTagline}</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-theme-ink-2">
              <Link to="/impressum" className="hover:text-theme-ink transition-colors">
                {t.legal.impressumTitle}
              </Link>
              <Link to="/datenschutz" className="hover:text-theme-ink transition-colors">
                {t.legal.privacyPolicy}
              </Link>
              <a href="mailto:info@fudda.de" className="hover:text-theme-ink transition-colors">
                {t.landing.footerContact}
              </a>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-4 text-xs text-theme-ink-3">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-theme-primary" />
                {t.landing.footerDsgvo}
              </span>
              <span>{t.landing.footerMadeIn}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-theme-line text-center text-xs text-theme-ink-3">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t.landing.footerRights}
          </div>
        </div>
      </footer>
    </div>
  );
}
