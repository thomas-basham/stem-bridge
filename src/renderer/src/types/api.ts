export type ProjectStatus = 'Tracking' | 'Mix Prep' | 'In Review';
export type ProjectRole = 'owner' | 'admin' | 'collaborator' | 'viewer';
export type SongVersionStatus = 'draft' | 'uploaded' | 'processing' | 'ready' | 'archived';
export type FileAssetKind = 'stem' | 'mixdown' | 'midi' | 'sample' | 'project' | 'other';
export type CommentStatus = 'open' | 'resolved';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  owner: string;
  ownerId?: string;
  description?: string | null;
  status: ProjectStatus;
  collaboratorCount: number;
  versionCount: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
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
  title: string;
  versionNumber: number;
  status: SongVersionStatus;
  durationSeconds?: number | null;
  waveformUrl?: string | null;
  audioUrl?: string | null;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt?: string;
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
  role: ProjectRole;
  status: InviteStatus;
  invitedById: string;
  invitedBy?: User;
  expiresAt?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
