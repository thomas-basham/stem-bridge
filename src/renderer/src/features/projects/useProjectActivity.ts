import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ACTIVITY_QUERY } from '@/constants/app-constants';
import { activityService } from '@/features/projects/activityService';
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
  refresh: () => Promise<void>;
};

export function useProjectActivity(
  projectId: string,
  page = DEFAULT_ACTIVITY_QUERY.page,
  pageSize = DEFAULT_ACTIVITY_QUERY.pageSize,
): UseProjectActivityResult {
  const [state, setState] = useState<ProjectActivityState>({
    status: 'loading',
    data: [],
    errorMessage: null,
  });

  const refresh = useCallback(async (): Promise<void> => {
    setState((currentState) => ({
      status: 'loading',
      data: currentState.data,
      errorMessage: null,
    }));

    try {
      const events = await activityService.list(projectId, { page, pageSize });
      setState({ status: 'success', data: events, errorMessage: null });
    } catch (error) {
      setState((currentState) => ({
        status: 'error',
        data: currentState.data,
        errorMessage: error instanceof Error ? error.message : 'Unable to load activity.',
      }));
    }
  }, [page, pageSize, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
