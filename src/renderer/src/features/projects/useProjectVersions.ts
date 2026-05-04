import { useCallback, useEffect, useRef, useState } from 'react';
import { versionsService } from '@/features/projects/versionsService';
import { useMountedRef } from '@/hooks/useMountedRef';
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
  const isMountedRef = useMountedRef();
  const requestIdRef = useRef(0);
  const [state, setState] = useState<ProjectVersionsState>({
    status: 'loading',
    data: [],
    errorMessage: null,
  });

  const refresh = useCallback(async (): Promise<SongVersion[]> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((currentState) => ({
      status: 'loading',
      data: currentState.data,
      errorMessage: null,
    }));

    try {
      const versions = await versionsService.list(projectId);

      if (isMountedRef.current && requestId === requestIdRef.current) {
        setState({ status: 'success', data: versions, errorMessage: null });
      }

      return versions;
    } catch (error: unknown) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return [];
      }

      setState((currentState) => ({
        status: 'error',
        data: currentState.data,
        errorMessage: error instanceof Error ? error.message : 'Unable to load versions.',
      }));
      return [];
    }
  }, [isMountedRef, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
