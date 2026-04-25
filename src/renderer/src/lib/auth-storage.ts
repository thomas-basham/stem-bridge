import type { User } from '@/types/api';

const authTokenKey = 'stembridge.desktop.auth-token';
const authUserKey = 'stembridge.desktop.auth-user';

const canUseStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const readJson = <T>(key: string): T | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
};

export const getAuthToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(authTokenKey);
};

export const setAuthToken = (token: string): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(authTokenKey, token);
};

export const clearAuthToken = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(authTokenKey);
};

export const getStoredUser = (): User | null => readJson<User>(authUserKey);

export const setStoredUser = (user: User): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(authUserKey, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(authUserKey);
};

export const setAuthSession = ({ token, user }: { token: string; user: User }): void => {
  setAuthToken(token);
  setStoredUser(user);
};

export const clearAuthSession = (): void => {
  clearAuthToken();
  clearStoredUser();
};
