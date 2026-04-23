import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { useDesktopMetadata } from '@/hooks/useDesktopMetadata';

const upcomingWorkspaceItems = ['Versions', 'Files', 'Comments'];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const metadataState = useDesktopMetadata();

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  const runtimeLabel =
    metadataState.status === 'success'
      ? `${metadataState.data.appName} v${metadataState.data.appVersion}`
      : 'Desktop runtime';

  return (
    <div className="desktop-shell">
      <aside className="desktop-sidebar">
        <div className="desktop-sidebar__brand">
          <span className="desktop-sidebar__eyebrow">Authenticated Area</span>
          <h1>StemBridge</h1>
          <p>Cross-DAW project routing for version review, file delivery, and timestamped notes.</p>
        </div>

        <nav className="desktop-nav" aria-label="Workspace">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              isActive ? 'desktop-nav__link desktop-nav__link--active' : 'desktop-nav__link'
            }
          >
            Projects
          </NavLink>

          {upcomingWorkspaceItems.map((item) => (
            <span key={item} className="desktop-nav__placeholder">
              {item}
            </span>
          ))}
        </nav>

        <div className="desktop-sidebar__section">
          <p className="desktop-sidebar__section-label">Signed in as</p>
          <div className="user-chip">
            <span className="user-chip__avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user?.name}</strong>
              <p>{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="desktop-sidebar__section desktop-sidebar__section--footer">
          <p className="desktop-sidebar__section-label">Runtime</p>
          <p className="desktop-sidebar__runtime">{runtimeLabel}</p>
          <button type="button" className="control-button control-button--ghost" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="desktop-main">
        <header className="desktop-topbar">
          <div>
            <p className="desktop-topbar__eyebrow">Desktop Workspace</p>
            <h2>StemBridge Desktop App</h2>
          </div>

          <div className="desktop-topbar__status">
            <span className="tag">Protected Route</span>
            <span className="tag">Context Isolation Enabled</span>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
