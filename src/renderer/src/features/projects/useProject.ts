import { useEffect, useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { projectsService } from '@/features/projects/projectsService';

type ProjectState =
  | {
      status: 'loading';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'success';
      data: ProjectSummary;
      errorMessage: null;
    }
  | {
      status: 'not-found';
      data: null;
      errorMessage: null;
    }
  | {
      status: 'error';
      data: null;
      errorMessage: string;
    };

export function useProject(projectId: string | undefined): ProjectState {
  const [state, setState] = useState<ProjectState>({
    status: 'loading',
    data: null,
    errorMessage: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!projectId) {
      setState({
        status: 'not-found',
        data: null,
        errorMessage: null,
      });
      return;
    }

    const loadProject = async (): Promise<void> => {
      try {
        const project = await projectsService.getById(projectId);

        if (!isMounted) {
          return;
        }

        if (!project) {
          setState({
            status: 'not-found',
            data: null,
            errorMessage: null,
          });
          return;
        }

        setState({
          status: 'success',
          data: project,
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            errorMessage: error instanceof Error ? error.message : 'Unable to load project.',
          });
        }
      }
    };

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return state;
}
