import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/app-constants';
import { useAuth } from '@/features/auth/auth-context';

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const returnPath = isAuthenticated ? APP_ROUTES.projects : APP_ROUTES.login;
  const returnLabel = isAuthenticated ? 'Back to Projects' : 'Back to Login';

  return (
    <div className="not-found-view">
      <section className="not-found-card">
        <p className="not-found-card__eyebrow">404</p>
        <h3>That route does not exist.</h3>
        <p>
          The requested page is outside the current StemBridge routing map. Use the primary route
          entry points to continue.
        </p>
        <Link to={returnPath} className="control-button control-button--link">
          {returnLabel}
        </Link>
      </section>
    </div>
  );
}
