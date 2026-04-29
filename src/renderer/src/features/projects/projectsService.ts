import axios from 'axios';
import type { ProjectSummary } from '@shared/types';
import { getApiErrorMessage, projectsApi } from '@/lib/api';
import { mockProjects, useMockProjectData, wait } from './mockProjectData';

export const projectsService = {
  async list(): Promise<ProjectSummary[]> {
    if (useMockProjectData) {
      await wait(450);
      return mockProjects;
    }

    try {
      return await projectsApi.list();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to load projects.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load projects.');
    }
  },
  async create(payload: { name: string; bpm?: number; musicalKey?: string }): Promise<ProjectSummary> {
    if (useMockProjectData) {
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
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to create project.'));
      }

      throw error instanceof Error ? error : new Error('Unable to create project.');
    }
  },
  async getById(projectId: string): Promise<ProjectSummary | null> {
    if (useMockProjectData) {
      await wait(220);
      return mockProjects.find((project) => project.id === projectId) ?? null;
    }

    try {
      return await projectsApi.getById(projectId);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }

        throw new Error(getApiErrorMessage(error, 'Unable to load project.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load project.');
    }
  },
};
