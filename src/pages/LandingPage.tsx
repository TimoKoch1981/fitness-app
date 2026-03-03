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
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-sm font-bold text-white">FB</span>
            </div>
            <span className="text-lg font-bold text-white">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              to="/login"
              className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5"
            >
              {t.auth.login}
            </Link>
            <Link
              to="/register"
              className="text-sm bg-teal-500 hover:bg-teal-400 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {t.auth.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Gradient background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-sm mb-8">
              <Shield className="w-4 h-4" />
              {t.landing.dsgvoBadge}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t.landing.heroTitle}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-all text-lg"
              >
                {t.landing.ctaStart}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-lg border border-gray-700"
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
            <ChevronDown className="w-6 h-6 text-gray-600" />
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section ref={featuresRef} className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.landing.featuresTitle}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, idx) => {
              const Icon = FEATURE_ICONS[idx];
              return (
                <FadeInSection key={key} delay={idx * 0.1}>
                  <div className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-teal-500/40 transition-all hover:shadow-lg hover:shadow-teal-500/5">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-teal-500/30 group-hover:to-emerald-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">
                      {(t.landing as Record<string, string>)[`feature_${key}_title`]}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
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
      <section className="py-20 sm:py-28 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.landing.howItWorksTitle}
            </h2>
            <p className="text-gray-400 text-lg">
              {t.landing.howItWorksSubtitle}
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepKeys.map((key, idx) => (
              <FadeInSection key={key} delay={idx * 0.15}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-lg shadow-teal-500/20">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {(t.landing as Record<string, string>)[`step_${key}_title`]}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.landing.testimonialsTitle}
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([1, 2, 3] as const).map((num) => (
              <FadeInSection key={num} delay={num * 0.1}>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-4 text-teal-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">
                    &ldquo;{(t.landing as Record<string, string>)[`testimonial_${num}_text`]}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500/30 to-emerald-500/30 rounded-full flex items-center justify-center text-sm font-bold text-teal-400">
                      {(t.landing as Record<string, string>)[`testimonial_${num}_name`]?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {(t.landing as Record<string, string>)[`testimonial_${num}_name`]}
                      </p>
                      <p className="text-xs text-gray-500">
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
      <section className="py-20 sm:py-28 bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              {t.landing.finalCtaTitle}
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              {t.landing.finalCtaSubtitle}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-all text-lg"
            >
              {t.landing.ctaStartFree}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo + tagline */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">FB</span>
              </div>
              <div>
                <p className="font-semibold text-white">{APP_NAME}</p>
                <p className="text-xs text-gray-500">{t.landing.footerTagline}</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/impressum" className="hover:text-white transition-colors">
                {t.legal.impressumTitle}
              </Link>
              <Link to="/datenschutz" className="hover:text-white transition-colors">
                {t.legal.privacyPolicy}
              </Link>
              <a href="mailto:info@fudda.de" className="hover:text-white transition-colors">
                {t.landing.footerContact}
              </a>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-500" />
                {t.landing.footerDsgvo}
              </span>
              <span>{t.landing.footerMadeIn}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/50 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t.landing.footerRights}
          </div>
        </div>
      </footer>
    </div>
  );
}
