import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { I18nProvider } from './providers/I18nProvider';
import { BuddyChatProvider } from './providers/BuddyChatProvider';
import { NotificationSchedulerProvider } from '../features/notifications/components/NotificationSchedulerProvider';
import { CelebrationProvider } from '../features/celebrations/CelebrationProvider';
import { InlineBuddyChatProvider } from '../shared/components/InlineBuddyChatContext';
import { InlineBuddyChat } from '../shared/components/InlineBuddyChat';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { OnboardingGuard } from '../shared/components/OnboardingGuard';
import { Navigation } from '../shared/components/Navigation';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { BuddyPage } from '../pages/BuddyPage';
import { CockpitPage } from '../pages/CockpitPage';
import { NutritionPage } from '../pages/NutritionPage';
import { TrainingPage } from '../pages/TrainingPage';
import { MedicalPage } from '../pages/MedicalPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OnboardingWizardPage } from '../pages/OnboardingWizardPage';

// Workout Session
import { ActiveWorkoutProvider } from '../features/workouts/context/ActiveWorkoutContext';
import { ActiveWorkoutPage } from '../features/workouts/components/ActiveWorkoutPage';
import { SpotifyCallback } from '../features/workouts/components/SpotifyCallback';

// Admin Pages
import { AdminRoute } from '../features/admin/components/AdminRoute';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminUsagePage } from '../pages/admin/AdminUsagePage';
import { AdminFeedbackPage } from '../pages/admin/AdminFeedbackPage';
import { FeatureVotingPage } from '../pages/FeatureVotingPage';
import { ImpressumPage } from '../pages/ImpressumPage';
import { DatenschutzPage } from '../pages/DatenschutzPage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';

function AppRoutes() {
  return (
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
  );
}

export default function App() {
  return (
    <QueryProvider>
      <I18nProvider>
        <AuthProvider>
          <BuddyChatProvider>
            <BrowserRouter>
              <NotificationSchedulerProvider>
                <CelebrationProvider>
                  <InlineBuddyChatProvider>
                    <AppRoutes />
                    <InlineBuddyChat />
                  </InlineBuddyChatProvider>
                </CelebrationProvider>
              </NotificationSchedulerProvider>
            </BrowserRouter>
          </BuddyChatProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
