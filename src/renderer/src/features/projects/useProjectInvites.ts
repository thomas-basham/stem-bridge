import { useCallback, useEffect, useState } from 'react';
import { invitesService } from '@/features/projects/invitesService';
import type { Invite } from '@/types/api';

type ProjectInvitesState =
  | {
      status: 'loading';
      data: Invite[];
      errorMessage: null;
    }
  | {
      status: 'success';
      data: Invite[];
      errorMessage: null;
    }
  | {
      status: 'error';
      data: Invite[];
      errorMessage: string;
    };

type UseProjectInvitesResult = ProjectInvitesState & {
  refresh: () => Promise<void>;
  createInvite: (payload: { email: string }) => Promise<Invite>;
};

export function useProjectInvites(projectId: string): UseProjectInvitesResult {
  const [state, setState] = useState<ProjectInvitesState>({
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
      const invites = await invitesService.list(projectId);
      setState({ status: 'success', data: invites, errorMessage: null });
    } catch (error) {
      setState({
        status: 'error',
        data: [],
        errorMessage: error instanceof Error ? error.message : 'Unable to load invites.',
      });
    }
  }, [projectId]);

  const createInvite = useCallback(
    async (payload: { email: string }): Promise<Invite> => {
      const invite = await invitesService.create(projectId, payload);
      await refresh();
      return invite;
    },
    [projectId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    createInvite,
  };
}
