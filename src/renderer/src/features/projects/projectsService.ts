import type { ProjectSummary } from '@shared/types';
import { projectsApi } from '@/lib/api';
import { isNotFoundApiError, toProjectServiceError } from './project-service-error';
import { mockProjects, shouldUseMockProjectData, wait } from './mockProjectData';

export const projectsService = {
  async list(): Promise<ProjectSummary[]> {
    if (shouldUseMockProjectData) {
      await wait(450);
      return mockProjects;
    }

    try {
      return await projectsApi.list();
    } catch (error: unknown) {
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
      return await projectsApi.create(payload);
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
      return await projectsApi.getById(projectId);
    } catch (error: unknown) {
      if (isNotFoundApiError(error)) {
        return null;
      }

      throw toProjectServiceError(error, 'Unable to load project.');
    }
  },
};
