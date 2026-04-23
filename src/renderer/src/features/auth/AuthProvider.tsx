import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  AuthContext,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/auth-context';

const authStorageKey = 'stembridge.desktop.auth-user';

const titleCase = (value: string): string => {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
};

const buildNameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0] ?? 'producer';
  return titleCase(localPart) || 'Producer';
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthUser>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string'
  );
};

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(authStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    return isAuthUser(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
};

const createAuthUser = (email: string, name: string): AuthUser => {
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedName = name.trim() || buildNameFromEmail(normalizedEmail);

  return {
    id: window.crypto.randomUUID(),
    name: resolvedName,
    email: normalizedEmail,
  };
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(user));
      return;
    }

    window.localStorage.removeItem(authStorageKey);
  }, [user]);

  const login = ({ email, password }: LoginInput): void => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    setUser(createAuthUser(email, buildNameFromEmail(email)));
  };

  const register = ({ name, email, password }: RegisterInput): void => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      return;
    }

    setUser(createAuthUser(email, name));
  };

  const logout = (): void => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
