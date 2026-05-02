export type ProjectRole = 'owner' | 'admin' | 'collaborator' | 'viewer';
export type FileAssetKind = 'stem' | 'mixdown' | 'midi' | 'sample' | 'project' | 'other';
export type VersionFileAssetType = 'STEM' | 'MIX' | 'MIDI' | 'SAMPLE' | 'OTHER';
export type CommentStatus = 'open' | 'resolved';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  bpm?: number | null;
  musicalKey?: string | null;
  owner?: User;
  collaboratorCount: number;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  collaborators?: Array<{
    id: string;
    joinedAt: string;
    user: User;
  }>;
  latestVersion?: {
    id: string;
    versionNumber: number;
    notes?: string | null;
    createdAt: string;
    fileAssetCount?: number;
    commentCount?: number;
  } | null;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  role: ProjectRole;
  joinedAt: string;
}

export interface SongVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  notes?: string | null;
  createdAt: string;
  createdBy: User;
  fileAssetCount?: number;
  commentCount?: number;
  fileAssets?: VersionFileAsset[];
  comments?: VersionComment[];
}

export interface VersionFileAsset {
  id: string;
  versionId?: string;
  name: string;
  originalName: string;
  type: VersionFileAssetType;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string;
  createdAt: string;
}

export interface VersionComment {
  id: string;
  versionId?: string;
  timestampSeconds: number;
  text: string;
  createdAt: string;
  author: User;
}

export interface FileAsset {
  id: string;
  projectId: string;
  songVersionId?: string | null;
  name: string;
  kind: FileAssetKind;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedById: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  songVersionId?: string | null;
  authorId: string;
  author?: User;
  body: string;
  timestampSeconds?: number | null;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  actorId: string;
  actor?: User;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Invite {
  id: string;
  projectId: string;
  email: string;
  status: InviteStatus;
  invitedBy?: User;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
