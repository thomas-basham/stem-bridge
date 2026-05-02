import { RENDERER_STORAGE_KEYS } from '@/constants/app-constants';
import type { User } from '@/types/api';

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

  return window.localStorage.getItem(RENDERER_STORAGE_KEYS.authToken);
};

export const setAuthToken = (token: string): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(RENDERER_STORAGE_KEYS.authToken, token);
};

export const clearAuthToken = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(RENDERER_STORAGE_KEYS.authToken);
};

export const getStoredUser = (): User | null => readJson<User>(RENDERER_STORAGE_KEYS.authUser);

export const setStoredUser = (user: User): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(RENDERER_STORAGE_KEYS.authUser, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(RENDERER_STORAGE_KEYS.authUser);
};

export const setAuthSession = ({ token, user }: { token: string; user: User }): void => {
  setAuthToken(token);
  setStoredUser(user);
};

export const clearAuthSession = (): void => {
  clearAuthToken();
  clearStoredUser();
};
