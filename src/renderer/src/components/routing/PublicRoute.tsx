import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';

export function PublicRoute() {
  const { hasInitialized, isAuthenticated } = useAuth();

  if (!hasInitialized) {
    return (
      <div className="route-loading">
        <LoadingSpinner label="Checking session" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return <Outlet />;
}
