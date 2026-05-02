import axios from 'axios';
import { getApiErrorMessage, invitesApi } from '@/lib/api';
import type { Invite } from '@/types/api';
import { useMockProjectData, wait } from './mockProjectData';

const mockInvitedBy = {
  id: 'mock-current-user',
  email: 'producer@stembridge.app',
  name: 'Producer',
};

const buildMockInvite = (projectId: string, email: string): Invite => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: window.crypto.randomUUID(),
    projectId,
    email: email.trim().toLowerCase(),
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    invitedBy: mockInvitedBy,
  };
};

const mockInvitesByProjectId: Record<string, Invite[]> = {
  'atlas-after-hours': [
    {
      id: 'atlas-invite-1',
      projectId: 'atlas-after-hours',
      email: 'mix.engineer@example.com',
      status: 'PENDING',
      createdAt: '2026-05-01T17:35:00.000Z',
      expiresAt: '2026-05-08T17:35:00.000Z',
      invitedBy: mockInvitedBy,
    },
  ],
  'electric-harbor': [],
  'neon-saturn': [],
};

const sortInvites = (invites: Invite[]): Invite[] => {
  return [...invites].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
};

export const invitesService = {
  async list(projectId: string): Promise<Invite[]> {
    if (useMockProjectData) {
      await wait(180);
      return sortInvites(mockInvitesByProjectId[projectId] ?? []);
    }

    try {
      return await invitesApi.list(projectId);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to load invites.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load invites.');
    }
  },

  async create(projectId: string, payload: { email: string }): Promise<Invite> {
    if (useMockProjectData) {
      await wait(220);
      const email = payload.email.trim().toLowerCase();
      const invites = (mockInvitesByProjectId[projectId] ??= []);
      const existingPendingInvite = invites.find((invite) => {
        return invite.email === email && invite.status === 'PENDING';
      });

      if (existingPendingInvite) {
        throw new Error(`An active invite for ${email} already exists.`);
      }

      const invite = buildMockInvite(projectId, email);
      invites.unshift(invite);
      return invite;
    }

    try {
      return await invitesApi.create(projectId, payload);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to send invite.'));
      }

      throw error instanceof Error ? error : new Error('Unable to send invite.');
    }
  },
};
