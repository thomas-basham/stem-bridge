import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACTIVITY_FEED_POLL_INTERVAL_MS,
  DEFAULT_ACTIVITY_QUERY,
} from '@/constants/app-constants';
import { activityService } from '@/features/projects/activityService';
import { subscribeToProjectActivityChanges } from '@/features/projects/projectActivityEvents';
import { useMountedRef } from '@/hooks/useMountedRef';
import type { ActivityEvent } from '@/types/api';

type ProjectActivityState =
  | {
      status: 'loading';
      data: ActivityEvent[];
      errorMessage: null;
    }
  | {
      status: 'success';
      data: ActivityEvent[];
      errorMessage: null;
    }
  | {
      status: 'error';
      data: ActivityEvent[];
      errorMessage: string;
    };

type UseProjectActivityResult = ProjectActivityState & {
  refresh: (options?: RefreshActivityOptions) => Promise<void>;
};

interface RefreshActivityOptions {
  silent?: boolean;
}

interface UseProjectActivityOptions {
  pollIntervalMs?: number;
}

export function useProjectActivity(
  projectId: string,
  page = DEFAULT_ACTIVITY_QUERY.page,
  pageSize = DEFAULT_ACTIVITY_QUERY.pageSize,
  options: UseProjectActivityOptions = {},
): UseProjectActivityResult {
  const isMountedRef = useMountedRef();
  const requestIdRef = useRef(0);
  const pollIntervalMs = options.pollIntervalMs ?? ACTIVITY_FEED_POLL_INTERVAL_MS;
  const [state, setState] = useState<ProjectActivityState>({
    status: 'loading',
    data: [],
    errorMessage: null,
  });

  const refresh = useCallback(async (refreshOptions: RefreshActivityOptions = {}): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!refreshOptions.silent) {
      setState((currentState) => ({
        status: 'loading',
        data: currentState.data,
        errorMessage: null,
      }));
    }

    try {
      const events = await activityService.list(projectId, { page, pageSize });

      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setState({ status: 'success', data: events, errorMessage: null });
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setState((currentState) => {
        if (refreshOptions.silent && currentState.status === 'success') {
          return currentState;
        }

        return {
          status: 'error',
          data: currentState.data,
          errorMessage: error instanceof Error ? error.message : 'Unable to load activity.',
        };
      });
    }
  }, [isMountedRef, page, pageSize, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (pollIntervalMs <= 0) {
      return;
    }

    const refreshIfVisible = (): void => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void refresh({ silent: true });
    };

    const intervalId = window.setInterval(refreshIfVisible, pollIntervalMs);

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [pollIntervalMs, refresh]);

  useEffect(() => {
    return subscribeToProjectActivityChanges((changedProjectId) => {
      if (changedProjectId === projectId) {
        void refresh({ silent: true });
      }
    });
  }, [projectId, refresh]);

  return {
    ...state,
    refresh,
  };
}
