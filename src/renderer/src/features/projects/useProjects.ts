import { useEffect, useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { projectsService } from '@/features/projects/projectsService';

type ProjectsState =
  | {
      status: 'loading';
      data: ProjectSummary[];
      errorMessage: null;
    }
  | {
      status: 'success';
      data: ProjectSummary[];
      errorMessage: null;
    }
  | {
      status: 'error';
      data: ProjectSummary[];
      errorMessage: string;
    };

export function useProjects(): ProjectsState {
  const [state, setState] = useState<ProjectsState>({
    status: 'loading',
    data: [],
    errorMessage: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async (): Promise<void> => {
      try {
        const projects = await projectsService.list();

        if (isMounted) {
          setState({
            status: 'success',
            data: projects,
            errorMessage: null,
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setState({
            status: 'error',
            data: [],
            errorMessage:
              error instanceof Error ? error.message : 'Unable to load project workspace.',
          });
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
