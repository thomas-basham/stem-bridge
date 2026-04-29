import { useCallback, useEffect, useState } from 'react';
import { versionsService } from '@/features/projects/versionsService';
import type { SongVersion } from '@/types/api';

export type ProjectVersionsState =
  | {
      status: 'loading';
      data: SongVersion[];
      errorMessage: null;
    }
  | {
      status: 'success';
      data: SongVersion[];
      errorMessage: null;
    }
  | {
      status: 'error';
      data: SongVersion[];
      errorMessage: string;
    };

export type UseProjectVersionsResult = ProjectVersionsState & {
  refresh: () => Promise<SongVersion[]>;
};

export function useProjectVersions(projectId: string): UseProjectVersionsResult {
  const [state, setState] = useState<ProjectVersionsState>({
    status: 'loading',
    data: [],
    errorMessage: null,
  });

  const refresh = useCallback(async (): Promise<SongVersion[]> => {
    setState((currentState) => ({
      status: 'loading',
      data: currentState.data,
      errorMessage: null,
    }));

    try {
      const versions = await versionsService.list(projectId);
      setState({ status: 'success', data: versions, errorMessage: null });
      return versions;
    } catch (error: unknown) {
      setState({
        status: 'error',
        data: [],
        errorMessage: error instanceof Error ? error.message : 'Unable to load versions.',
      });
      return [];
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
