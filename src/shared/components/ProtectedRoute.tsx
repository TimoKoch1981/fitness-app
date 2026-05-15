import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useDisclaimerCheck } from '../hooks/useDisclaimerCheck';
import { DisclaimerModal } from './DisclaimerModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { accepted: disclaimerAccepted, markAccepted } = useDisclaimerCheck(user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br bg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-2" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking disclaimer status
  if (disclaimerAccepted === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br bg-theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-2" />
      </div>
    );
  }

  // Show disclaimer if not accepted
  if (!disclaimerAccepted) {
    return <DisclaimerModal onAccepted={markAccepted} />;
  }

  return <>{children}</>;
}
