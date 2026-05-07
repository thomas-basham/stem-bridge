export const desktopChannels = {
  getMetadata: 'app:get-metadata',
  getNetworkStatus: 'network:get-status',
  getProjectSnapshot: 'cache:get-project-snapshot',
  saveProjectSnapshot: 'cache:save-project-snapshot',
  importUploadFile: 'cache:import-upload-file',
  readCachedFile: 'cache:read-cached-file',
  listQueue: 'queue:list',
  enqueueQueueItem: 'queue:enqueue',
  updateQueueItem: 'queue:update',
  retryQueue: 'queue:retry-all',
  queueChanged: 'queue:changed',
  chooseWatchFolder: 'daw:choose-watch-folder',
  listWatchFolders: 'daw:list-watch-folders',
  removeWatchFolder: 'daw:remove-watch-folder',
  listDawCandidates: 'daw:list-candidates',
  importDawCandidate: 'daw:import-candidate',
  cacheDawCandidate: 'daw:cache-candidate',
  markDawCandidatesImported: 'daw:mark-candidates-imported',
  dawCandidatesChanged: 'daw:candidates-changed',
} as const;

export interface DesktopMetadata {
  appName: string;
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
}

export type DesktopNetworkStatus = 'online' | 'offline' | 'degraded';

export interface DesktopNetworkState {
  status: DesktopNetworkStatus;
  checkedAt: string;
}

export interface DesktopProjectSnapshot<T = unknown> {
  key: string;
  data: T;
  savedAt: string;
}

export type DesktopQueueItemType = 'comment' | 'version-create' | 'file-upload';
export type DesktopQueueItemStatus = 'pending' | 'syncing' | 'failed' | 'complete';

export interface DesktopQueueItem<TPayload = unknown> {
  id: string;
  type: DesktopQueueItemType;
  status: DesktopQueueItemStatus;
  payload: TPayload;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface DesktopQueuedCommentPayload {
  projectId: string;
  versionId: string;
  tempCommentId: string;
  text: string;
  timestampSeconds: number;
}

export interface DesktopQueuedVersionCreatePayload {
  projectId: string;
  localVersionId: string;
  notes?: string;
}

export interface DesktopQueuedFileUploadPayload {
  projectId: string;
  localVersionId?: string;
  versionId?: string;
  cachedFileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileType: 'STEM' | 'MIX' | 'MIDI' | 'SAMPLE' | 'OTHER';
}

export interface DesktopCachedUploadFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  cachePath: string;
  createdAt: string;
}

export interface DesktopCachedFileData extends DesktopCachedUploadFile {
  data: Uint8Array;
}

export type DesktopDawType = 'ABLETON';

export interface DesktopWatchedFolder {
  id: string;
  label: string;
  path: string;
  dawType: DesktopDawType;
  enabled: boolean;
  createdAt: string;
  lastScanAt?: string;
}

export interface DesktopDawFileCandidate {
  id: string;
  folderId: string;
  path: string;
  name: string;
  type: 'STEM' | 'MIX' | 'MIDI' | 'SAMPLE' | 'OTHER';
  mimeType: string;
  sizeBytes: number;
  modifiedAt: string;
  imported: boolean;
  discoveredAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  bpm?: number | null;
  musicalKey?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    name?: string;
  };
  collaboratorCount: number;
  versionCount: number;
  collaborators?: Array<{
    id: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      name?: string;
    };
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

export interface StemBridgeDesktopApi {
  app: {
    getMetadata: () => Promise<DesktopMetadata>;
  };
  network: {
    getStatus: () => Promise<DesktopNetworkState>;
  };
  cache: {
    getProjectSnapshot: <T = unknown>(key: string) => Promise<DesktopProjectSnapshot<T> | null>;
    saveProjectSnapshot: <T = unknown>(snapshot: {
      key: string;
      data: T;
    }) => Promise<DesktopProjectSnapshot<T>>;
    importUploadFile: (file: unknown) => Promise<DesktopCachedUploadFile>;
    readCachedFile: (cachedFileId: string) => Promise<DesktopCachedFileData>;
  };
  queue: {
    list: () => Promise<DesktopQueueItem[]>;
    enqueue: <TPayload = unknown>(item: {
      type: DesktopQueueItemType;
      payload: TPayload;
    }) => Promise<DesktopQueueItem<TPayload>>;
    update: <TPayload = unknown>(
      itemId: string,
      patch: Partial<Pick<DesktopQueueItem<TPayload>, 'status' | 'payload' | 'errorMessage'>>,
    ) => Promise<DesktopQueueItem<TPayload>>;
    retryAll: () => Promise<DesktopQueueItem[]>;
    onChanged: (callback: (items: DesktopQueueItem[]) => void) => () => void;
  };
  daw: {
    chooseWatchFolder: () => Promise<DesktopWatchedFolder | null>;
    listWatchFolders: () => Promise<DesktopWatchedFolder[]>;
    removeWatchFolder: (folderId: string) => Promise<DesktopWatchedFolder[]>;
    listCandidates: () => Promise<DesktopDawFileCandidate[]>;
    importCandidate: (candidateId: string) => Promise<DesktopCachedUploadFile>;
    cacheCandidate: (candidateId: string) => Promise<DesktopCachedUploadFile>;
    markCandidatesImported: (candidateIds: string[]) => Promise<DesktopDawFileCandidate[]>;
    onCandidatesChanged: (callback: (candidates: DesktopDawFileCandidate[]) => void) => () => void;
  };
}
