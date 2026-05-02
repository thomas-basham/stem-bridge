import { useCallback, useEffect, useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { projectsService } from '@/features/projects/projectsService';

interface CreateProjectInput {
  name: string;
  bpm?: number;
  musicalKey?: string;
}

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

type UseProjectsResult = ProjectsState & {
  refresh: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<ProjectSummary>;
};

export function useProjects(): UseProjectsResult {
  const [state, setState] = useState<ProjectsState>({
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
      const projects = await projectsService.list();

      setState({
        status: 'success',
        data: projects,
        errorMessage: null,
      });
    } catch (error: unknown) {
      setState((currentState) => ({
        status: 'error',
        data: currentState.data,
        errorMessage: error instanceof Error ? error.message : 'Unable to load project workspace.',
      }));
    }
  }, []);

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<ProjectSummary> => {
      const project = await projectsService.create(input);
      await refresh();
      return project;
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    createProject,
  };
}
