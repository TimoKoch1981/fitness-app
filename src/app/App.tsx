import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { I18nProvider } from './providers/I18nProvider';
import { BuddyChatProvider } from './providers/BuddyChatProvider';
import { NotificationSchedulerProvider } from '../features/notifications/components/NotificationSchedulerProvider';
import { CelebrationProvider } from '../features/celebrations/CelebrationProvider';
import { InlineBuddyChatProvider } from '../shared/components/InlineBuddyChatContext';
import { RestTimerProvider } from '../features/timer/context/RestTimerContext';
import { GlobalTimerOverlay } from '../features/timer/components/GlobalTimerOverlay';
import { FeatureFlagProvider } from '../lib/featureFlags/FeatureFlagProvider';

// InlineBuddyChat is heavy (pulls in all feature hooks + AI agents) — lazy-load it
const InlineBuddyChat = lazy(() => import('../shared/components/InlineBuddyChat').then(m => ({ default: m.InlineBuddyChat })));
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { OnboardingGuard } from '../shared/components/OnboardingGuard';
import { Navigation } from '../shared/components/Navigation';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import { PWAUpdatePrompt } from '../shared/components/PWAUpdatePrompt';
import { OfflineBanner } from '../shared/components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy-loaded Pages (code-split per route)
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const BuddyPage = lazy(() => import('../pages/BuddyPage').then(m => ({ default: m.BuddyPage })));
const CockpitPage = lazy(() => import('../pages/CockpitPage').then(m => ({ default: m.CockpitPage })));
const NutritionPage = lazy(() => import('../pages/NutritionPage').then(m => ({ default: m.NutritionPage })));
const TrainingPage = lazy(() => import('../pages/TrainingPage').then(m => ({ default: m.TrainingPage })));
const MedicalPage = lazy(() => import('../pages/MedicalPage').then(m => ({ default: m.MedicalPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const OnboardingWizardPage = lazy(() => import('../pages/OnboardingWizardPage').then(m => ({ default: m.OnboardingWizardPage })));
const FeatureVotingPage = lazy(() => import('../pages/FeatureVotingPage').then(m => ({ default: m.FeatureVotingPage })));
const ImpressumPage = lazy(() => import('../pages/ImpressumPage').then(m => ({ default: m.ImpressumPage })));
const DatenschutzPage = lazy(() => import('../pages/DatenschutzPage').then(m => ({ default: m.DatenschutzPage })));
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));

// Lazy-loaded Workout Session
const ActiveWorkoutProvider = lazy(() => import('../features/workouts/context/ActiveWorkoutContext').then(m => ({ default: m.ActiveWorkoutProvider })));
const ActiveWorkoutPage = lazy(() => import('../features/workouts/components/ActiveWorkoutPage').then(m => ({ default: m.ActiveWorkoutPage })));
const SpotifyCallback = lazy(() => import('../features/workouts/components/SpotifyCallback').then(m => ({ default: m.SpotifyCallback })));

// Lazy-loaded Admin Pages
const AdminRoute = lazy(() => import('../features/admin/components/AdminRoute').then(m => ({ default: m.AdminRoute })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminUsagePage = lazy(() => import('../pages/admin/AdminUsagePage').then(m => ({ default: m.AdminUsagePage })));
const AdminFeedbackPage = lazy(() => import('../pages/admin/AdminFeedbackPage').then(m => ({ default: m.AdminFeedbackPage })));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes (with onboarding guard) */}
        <Route
          path="/buddy"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <BuddyPage />
                <Navigation />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cockpit"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <CockpitPage />
                <Navigation />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nutrition"
          element={
            <ProtectedRoute>
              <NutritionPage />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <TrainingPage />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={<Navigate to="/nutrition" replace />}
        />
        <Route
          path="/medical"
          element={
            <ProtectedRoute>
              <MedicalPage />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
              <Navigation />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProductsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/usage"
          element={
            <AdminRoute>
              <AdminUsagePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <AdminRoute>
              <AdminFeedbackPage />
            </AdminRoute>
          }
        />

        {/* Onboarding Wizard (no Navigation — full-screen, like workout) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingWizardPage />
            </ProtectedRoute>
          }
        />

        {/* Active Workout Session (no Navigation — full-screen experience) */}
        <Route
          path="/workout/active"
          element={
            <ProtectedRoute>
              <ActiveWorkoutProvider>
                <ActiveWorkoutPage />
              </ActiveWorkoutProvider>
            </ProtectedRoute>
          }
        />

        {/* Feature Voting (public, authenticated) */}
        <Route
          path="/features"
          element={
            <ProtectedRoute>
              <FeatureVotingPage />
              <Navigation />
            </ProtectedRoute>
          }
        />

        {/* Spotify OAuth Callback (popup window, no nav) */}
        <Route path="/spotify/callback" element={<SpotifyCallback />} />

        {/* Redirects for old URLs */}
        <Route path="/dashboard" element={<Navigate to="/cockpit" replace />} />
        <Route path="/meals" element={<Navigate to="/nutrition" replace />} />
        <Route path="/workouts" element={<Navigate to="/training" replace />} />
        <Route path="/body" element={<Navigate to="/nutrition" replace />} />
        <Route path="/reports" element={<Navigate to="/cockpit" replace />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/cockpit" replace />} />
        <Route path="*" element={<Navigate to="/cockpit" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <I18nProvider>
          <FeatureFlagProvider>
            <AuthProvider>
              <BuddyChatProvider>
                <BrowserRouter>
                  <NotificationSchedulerProvider>
                    <CelebrationProvider>
                      <RestTimerProvider>
                        <InlineBuddyChatProvider>
                          <AppRoutes />
                          <Suspense fallback={null}>
                            <InlineBuddyChat />
                          </Suspense>
                          <GlobalTimerOverlay />
                        </InlineBuddyChatProvider>
                      </RestTimerProvider>
                    </CelebrationProvider>
                  </NotificationSchedulerProvider>
                </BrowserRouter>
              </BuddyChatProvider>
            </AuthProvider>
          </FeatureFlagProvider>
          {/* PWA: global overlays (outside router, inside I18nProvider for translations) */}
          <PWAUpdatePrompt />
          <OfflineBanner />
        </I18nProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
