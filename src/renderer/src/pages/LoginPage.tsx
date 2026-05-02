import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, useToast } from '@/components/ui';
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
  const toast = useToast();
  const { clearError, error, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    try {
      await login({ email, password });
      toast.success('Signed in', 'Your project workspace is ready.');
      navigate(resolveRedirectPath(location.state), { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to sign in.';
      toast.error('Sign in failed', message);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <p className="auth-card__eyebrow">Login</p>
        <h2>Open your workspace</h2>
        <p>Sign in with your StemBridge account to continue to your project workspace.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="producer@stembridge.app"
          autoComplete="email"
          disabled={isLoading}
          required
        />

        <div className="auth-password-field">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={isLoading}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="auth-password-field__toggle"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isLoading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </Button>
        </div>

        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth isLoading={isLoading} loadingLabel="Signing in...">
          Continue to Projects
        </Button>
      </form>

      <div className="auth-card__footer">
        <span>Need an account?</span>
        <Link to="/register">Create one</Link>
      </div>
    </div>
  );
}
