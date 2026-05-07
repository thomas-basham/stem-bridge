import type { ProjectSummary } from '@shared/types';
import { projectsApi } from '@/lib/api';
import {
  desktopSnapshotKeys,
  isLikelyNetworkError,
  readDesktopSnapshot,
  saveDesktopSnapshot,
} from '@/lib/desktop';
import { isNotFoundApiError, toProjectServiceError } from './project-service-error';
import { mockProjects, shouldUseMockProjectData, wait } from './mockProjectData';

export const projectsService = {
  async list(): Promise<ProjectSummary[]> {
    if (shouldUseMockProjectData) {
      await wait(450);
      return mockProjects;
    }

    try {
      const projects = await projectsApi.list();
      void saveDesktopSnapshot(desktopSnapshotKeys.projectsList, projects);
      return projects;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedSnapshot = await readDesktopSnapshot<ProjectSummary[]>(
          desktopSnapshotKeys.projectsList,
        );

        if (cachedSnapshot) {
          return cachedSnapshot.data;
        }
      }

      throw toProjectServiceError(error, 'Unable to load projects.');
    }
  },
  async create(payload: {
    name: string;
    bpm?: number;
    musicalKey?: string;
  }): Promise<ProjectSummary> {
    if (shouldUseMockProjectData) {
      await wait(250);
      return {
        id: window.crypto.randomUUID(),
        name: payload.name,
        bpm: payload.bpm ?? null,
        musicalKey: payload.musicalKey ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collaboratorCount: 1,
        versionCount: 0,
        latestVersion: null,
      };
    }

    try {
      const project = await projectsApi.create(payload);
      const cachedProjects = await readDesktopSnapshot<ProjectSummary[]>(
        desktopSnapshotKeys.projectsList,
      );
      void saveDesktopSnapshot(desktopSnapshotKeys.project(project.id), project);

      if (cachedProjects) {
        void saveDesktopSnapshot(desktopSnapshotKeys.projectsList, [project, ...cachedProjects.data]);
      }

      return project;
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to create project.');
    }
  },
  async getById(projectId: string): Promise<ProjectSummary | null> {
    if (shouldUseMockProjectData) {
      await wait(220);
      return mockProjects.find((project) => project.id === projectId) ?? null;
    }

    try {
      const project = await projectsApi.getById(projectId);
      void saveDesktopSnapshot(desktopSnapshotKeys.project(projectId), project);
      return project;
    } catch (error: unknown) {
      if (isNotFoundApiError(error)) {
        return null;
      }

      if (isLikelyNetworkError(error)) {
        const cachedProject = await readDesktopSnapshot<ProjectSummary>(
          desktopSnapshotKeys.project(projectId),
        );

        if (cachedProject) {
          return cachedProject.data;
        }

        const cachedProjects = await readDesktopSnapshot<ProjectSummary[]>(
          desktopSnapshotKeys.projectsList,
        );
        return cachedProjects?.data.find((project) => project.id === projectId) ?? null;
      }

      throw toProjectServiceError(error, 'Unable to load project.');
    }
  },
};
