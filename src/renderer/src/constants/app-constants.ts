import type { ActivityEventType, VersionFileAssetType } from '@/types/api';

export const APP_ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  projects: '/projects',
  projectDetailPattern: '/projects/:projectId',
  projectDetail(projectId: string): string {
    return `/projects/${projectId}`;
  },
  notFound: '*',
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
  },
  projects: {
    list: '/projects',
    detail(projectId: string): string {
      return `/projects/${projectId}`;
    },
    members(projectId: string): string {
      return `/projects/${projectId}/members`;
    },
    versions(projectId: string): string {
      return `/projects/${projectId}/versions`;
    },
    files(projectId: string): string {
      return `/projects/${projectId}/files`;
    },
    comments(projectId: string): string {
      return `/projects/${projectId}/comments`;
    },
    activity(projectId: string): string {
      return `/projects/${projectId}/activity`;
    },
    invites(projectId: string): string {
      return `/projects/${projectId}/invites`;
    },
  },
  versions: {
    detail(versionId: string): string {
      return `/versions/${versionId}`;
    },
    fileUpload(versionId: string): string {
      return `/versions/${versionId}/files/upload`;
    },
    fileDownload(versionId: string, fileId: string): string {
      return `/versions/${versionId}/files/${fileId}/download`;
    },
    downloadZip(versionId: string): string {
      return `/versions/${versionId}/download`;
    },
    comments(versionId: string): string {
      return `/versions/${versionId}/comments`;
    },
  },
  comments: {
    detail(commentId: string): string {
      return `/comments/${commentId}`;
    },
  },
  invites: {
    detail(inviteId: string): string {
      return `/invites/${inviteId}`;
    },
  },
} as const;

export const APP_EVENTS = {
  unauthorized: 'stembridge:unauthorized',
} as const;

export const RENDERER_STORAGE_KEYS = {
  authToken: 'stembridge.desktop.auth-token',
  authUser: 'stembridge.desktop.auth-user',
} as const;

export const DEFAULT_ACTIVITY_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export const ACTIVITY_EVENT_TYPES = {
  projectCreated: 'PROJECT_CREATED',
  projectUpdated: 'PROJECT_UPDATED',
  memberAdded: 'MEMBER_ADDED',
  memberRemoved: 'MEMBER_REMOVED',
  inviteSent: 'INVITE_SENT',
  inviteAccepted: 'INVITE_ACCEPTED',
  versionCreated: 'VERSION_CREATED',
  fileUploaded: 'FILE_UPLOADED',
  commentAdded: 'COMMENT_ADDED',
} as const satisfies Record<string, ActivityEventType>;

export const ACTIVITY_METADATA_KEYS = {
  email: 'email',
  fileName: 'name',
  fileType: 'type',
  timestampSeconds: 'timestampSeconds',
  versionNumber: 'versionNumber',
} as const;

export const VERSION_FILE_TYPES = [
  'MIX',
  'STEM',
  'MIDI',
  'SAMPLE',
  'OTHER',
] as const satisfies readonly VersionFileAssetType[];

export const UPLOAD_FILE_TYPES = [
  'STEM',
  'MIX',
  'MIDI',
  'SAMPLE',
  'OTHER',
] as const satisfies readonly VersionFileAssetType[];

export const PRIMARY_MIX_FILE_TYPE: VersionFileAssetType = 'MIX';

export const DEFAULT_UPLOAD_FILE_TYPE: VersionFileAssetType = 'STEM';

export const FILE_TYPE_LABELS = {
  MIX: 'Mix',
  STEM: 'Stem',
  MIDI: 'MIDI',
  SAMPLE: 'Sample',
  OTHER: 'Other',
} as const satisfies Record<VersionFileAssetType, string>;
