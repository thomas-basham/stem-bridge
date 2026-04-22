import { NavLink, Outlet } from 'react-router-dom';

const plannedViews = ['Projects', 'Versions', 'Files', 'Comments'];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__eyebrow">Desktop MVP</span>
          <h1>StemBridge</h1>
          <p>Version review, file exchange, and creative feedback for producer workflows.</p>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            Dashboard
          </NavLink>

          {plannedViews.map((view) => (
            <span key={view} className="sidebar__coming-soon">
              {view}
            </span>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p>Built for desktop-first collaboration across Ableton, FL Studio, and shared stems.</p>
        </div>
      </aside>

      <main className="main-panel">
        <header className="main-panel__header">
          <div>
            <p className="main-panel__eyebrow">Creative Operations</p>
            <h2>StemBridge Desktop App</h2>
          </div>

          <div className="main-panel__tags" aria-label="Feature highlights">
            <span className="tag">Electron</span>
            <span className="tag">React</span>
            <span className="tag">Secure Preload Bridge</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
