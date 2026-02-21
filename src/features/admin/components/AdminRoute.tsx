/**
 * AdminRoute — Guard component that restricts access to admin users.
 * Redirects non-admins to /buddy.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/buddy" replace />;
  }

  return <>{children}</>;
}
