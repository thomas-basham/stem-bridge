import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ROUTES } from '@/constants/app-constants';
import { useAuthStore } from '@/features/auth/auth-store';
import { authApi } from '@/lib/api';
import { renderWithAppProviders } from '@/test/render';
import { LoginPage } from './LoginPage';
import type { User } from '@/types/api';

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
  getApiErrorMessage: (error: unknown, fallback = 'Request failed.') =>
    error instanceof Error ? error.message : fallback,
  unauthorizedEventName: 'stembridge:unauthorized',
}));

const mockUser: User = {
  id: 'user-1',
  email: 'producer@stembridge.app',
  name: 'Producer',
};

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      user: null,
      status: 'idle',
      error: null,
      hasInitialized: true,
    });
  });

  it('renders and submits the login form', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'test-token',
      user: mockUser,
    });

    renderWithAppProviders(
      <Routes>
        <Route path={APP_ROUTES.login} element={<LoginPage />} />
        <Route path={APP_ROUTES.projects} element={<h1>Projects route</h1>} />
      </Routes>,
      { initialEntries: [APP_ROUTES.login] },
    );

    expect(screen.getByRole('heading', { name: /open your workspace/i })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), mockUser.email);
    await user.type(screen.getByLabelText(/^password$/i), 'password-123');
    await user.click(screen.getByRole('button', { name: /continue to projects/i }));

    expect(authApi.login).toHaveBeenCalledWith({
      email: mockUser.email,
      password: 'password-123',
    });
    expect(await screen.findByRole('heading', { name: /projects route/i })).toBeInTheDocument();
  });
});
