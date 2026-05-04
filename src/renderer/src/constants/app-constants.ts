import type { ActivityEventType, VersionFileAssetType } from '@/types/api';

const encodePathSegment = (value: string): string => encodeURIComponent(value);

export const APP_ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  projects: '/projects',
  projectDetailPattern: '/projects/:projectId',
  projectDetail(projectId: string): string {
    return `/projects/${encodePathSegment(projectId)}`;
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
      return `/projects/${encodePathSegment(projectId)}`;
    },
    members(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/members`;
    },
    versions(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/versions`;
    },
    files(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/files`;
    },
    comments(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/comments`;
    },
    activity(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/activity`;
    },
    invites(projectId: string): string {
      return `/projects/${encodePathSegment(projectId)}/invites`;
    },
  },
  versions: {
    detail(versionId: string): string {
      return `/versions/${encodePathSegment(versionId)}`;
    },
    fileUpload(versionId: string): string {
      return `/versions/${encodePathSegment(versionId)}/files/upload`;
    },
    fileDownload(versionId: string, fileId: string): string {
      return `/versions/${encodePathSegment(versionId)}/files/${encodePathSegment(fileId)}/download`;
    },
    downloadZip(versionId: string): string {
      return `/versions/${encodePathSegment(versionId)}/download`;
    },
    comments(versionId: string): string {
      return `/versions/${encodePathSegment(versionId)}/comments`;
    },
  },
  comments: {
    detail(commentId: string): string {
      return `/comments/${encodePathSegment(commentId)}`;
    },
  },
  invites: {
    detail(inviteId: string): string {
      return `/invites/${encodePathSegment(inviteId)}`;
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

export const ACTIVITY_FEED_POLL_INTERVAL_MS = 5000;

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
