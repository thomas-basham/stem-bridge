import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('Nova Lane');
  const [email, setEmail] = useState('nova@stembridge.app');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    register({ name, email, password });
    navigate('/projects', { replace: true });
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <p className="auth-card__eyebrow">Register</p>
        <h2>Create a desktop session</h2>
        <p>Set up a placeholder account and route directly into the authenticated project workspace.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field-group">
          <span>Display Name</span>
          <input
            className="text-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Producer name"
            required
          />
        </label>

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
            placeholder="Choose password"
            required
          />
        </label>

        <button type="submit" className="control-button control-button--wide">
          Create Account
        </button>
      </form>

      <div className="auth-card__footer">
        <span>Already have access?</span>
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
