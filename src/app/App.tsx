import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { I18nProvider } from './providers/I18nProvider';
import { BuddyChatProvider } from './providers/BuddyChatProvider';
import { NotificationSchedulerProvider } from '../features/notifications/components/NotificationSchedulerProvider';
import { InlineBuddyChatProvider } from '../shared/components/InlineBuddyChatContext';
import { InlineBuddyChat } from '../shared/components/InlineBuddyChat';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { Navigation } from '../shared/components/Navigation';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { BuddyPage } from '../pages/BuddyPage';
import { CockpitPage } from '../pages/CockpitPage';
import { TrackingPage } from '../pages/TrackingPage';
import { MedicalPage } from '../pages/MedicalPage';
import { ProfilePage } from '../pages/ProfilePage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/buddy"
        element={
          <ProtectedRoute>
            <BuddyPage />
            <Navigation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cockpit"
        element={
          <ProtectedRoute>
            <CockpitPage />
            <Navigation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <TrackingPage />
            <Navigation />
          </ProtectedRoute>
        }
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

      {/* Redirects for old URLs */}
      <Route path="/dashboard" element={<Navigate to="/cockpit" replace />} />
      <Route path="/meals" element={<Navigate to="/tracking" replace />} />
      <Route path="/workouts" element={<Navigate to="/tracking" replace />} />
      <Route path="/body" element={<Navigate to="/tracking" replace />} />
      <Route path="/reports" element={<Navigate to="/cockpit" replace />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/buddy" replace />} />
      <Route path="*" element={<Navigate to="/buddy" replace />} />
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
                <InlineBuddyChatProvider>
                  <AppRoutes />
                  <InlineBuddyChat />
                </InlineBuddyChatProvider>
              </NotificationSchedulerProvider>
            </BrowserRouter>
          </BuddyChatProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
