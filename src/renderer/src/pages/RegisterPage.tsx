import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, useToast } from '@/components/ui';
import { APP_ROUTES } from '@/constants/app-constants';
import { useAuth } from '@/features/auth/auth-context';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { clearError, error, isLoading, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    try {
      await register({ name, email, password });
      toast.success('Account created', 'Your StemBridge workspace is ready.');
      navigate(APP_ROUTES.projects, { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create account.';
      toast.error('Registration failed', message);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <p className="auth-card__eyebrow">Register</p>
        <h2>Create a desktop session</h2>
        <p>Create a StemBridge account and start from the authenticated project workspace.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Input
          label="Display Name"
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Producer name"
          autoComplete="name"
          disabled={isLoading}
          required
        />

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
            placeholder="Choose password"
            autoComplete="new-password"
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

        <Button type="submit" fullWidth isLoading={isLoading} loadingLabel="Creating account...">
          Create Account
        </Button>
      </form>

      <div className="auth-card__footer">
        <span>Already have access?</span>
        <Link to={APP_ROUTES.login}>Sign in</Link>
      </div>
    </div>
  );
}
