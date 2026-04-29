import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { unauthorizedEventName } from '@/lib/api';

export function AuthProvider({ children }: PropsWithChildren) {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = (): void => logout();

    window.addEventListener(unauthorizedEventName, handleUnauthorized);
    return () => window.removeEventListener(unauthorizedEventName, handleUnauthorized);
  }, [logout]);

  return children;
}
