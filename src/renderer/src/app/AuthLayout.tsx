import { NavLink, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <section className="auth-layout__hero">
        <div className="auth-layout__copy">
          <p className="auth-layout__eyebrow">Public Access</p>
          <h1>StemBridge</h1>
          <p>
            Collaborate across Ableton, FL Studio, stems, MIDI, and mix revisions from one
            desktop-first workspace.
          </p>
        </div>

        <div className="auth-layout__feature-list">
          <div className="auth-layout__feature">
            <strong>Version Review</strong>
            <span>Track revisions and timestamped feedback per upload.</span>
          </div>
          <div className="auth-layout__feature">
            <strong>Secure Desktop Shell</strong>
            <span>Electron preload bridge with isolated renderer routing.</span>
          </div>
          <div className="auth-layout__feature">
            <strong>Project Delivery</strong>
            <span>Prepare stems, mixdowns, samples, and bundle downloads.</span>
          </div>
        </div>

        <div className="auth-layout__tabs" aria-label="Authentication">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'auth-layout__tab auth-layout__tab--active' : 'auth-layout__tab'
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive ? 'auth-layout__tab auth-layout__tab--active' : 'auth-layout__tab'
            }
          >
            Register
          </NavLink>
        </div>
      </section>

      <main className="auth-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
