import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { I18nProvider } from './providers/I18nProvider';
import { BuddyChatProvider } from './providers/BuddyChatProvider';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { Navigation } from '../shared/components/Navigation';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { BuddyPage } from '../pages/BuddyPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MealsPage } from '../pages/MealsPage';
import { WorkoutsPage } from '../pages/WorkoutsPage';
import { MedicalPage } from '../pages/MedicalPage';
import { BodyPage } from '../pages/BodyPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ReportsPage } from '../pages/ReportsPage';

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
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
            <Navigation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <ProtectedRoute>
            <MealsPage />
            <Navigation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workouts"
        element={
          <ProtectedRoute>
            <WorkoutsPage />
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
        path="/body"
        element={
          <ProtectedRoute>
            <BodyPage />
            <Navigation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
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
              <AppRoutes />
            </BrowserRouter>
          </BuddyChatProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
