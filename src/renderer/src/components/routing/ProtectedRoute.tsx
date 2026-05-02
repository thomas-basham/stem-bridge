import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui';
import { APP_ROUTES } from '@/constants/app-constants';
import { useAuth } from '@/features/auth/auth-context';

export function ProtectedRoute() {
  const location = useLocation();
  const { hasInitialized, isAuthenticated } = useAuth();

  if (!hasInitialized) {
    return (
      <div className="route-loading">
        <LoadingSpinner label="Checking session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
