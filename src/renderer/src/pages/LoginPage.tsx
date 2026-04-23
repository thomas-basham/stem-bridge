import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';

const resolveRedirectPath = (state: unknown): string => {
  if (typeof state !== 'object' || state === null) {
    return '/projects';
  }

  const fromPath = (state as { from?: { pathname?: string } }).from?.pathname;
  return fromPath || '/projects';
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('producer@stembridge.app');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    login({ email, password });
    navigate(resolveRedirectPath(location.state), { replace: true });
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <p className="auth-card__eyebrow">Login</p>
        <h2>Open your workspace</h2>
        <p>Use the placeholder form to enter the protected project routes in the desktop shell.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field-group">
          <span>Email</span>
          <input
            className="text-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="producer@stembridge.app"
            required
          />
        </label>

        <label className="field-group">
          <span>Password</span>
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        <button type="submit" className="control-button control-button--wide">
          Continue to Projects
        </button>
      </form>

      <div className="auth-card__footer">
        <span>Need an account?</span>
        <Link to="/register">Create one</Link>
      </div>
    </div>
  );
}
