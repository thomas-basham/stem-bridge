import type {
  DesktopCachedFileData,
  DesktopCachedUploadFile,
  DesktopDawFileCandidate,
  DesktopProjectSnapshot,
  DesktopQueueItem,
} from '@shared/types';

export const isDesktopBridgeAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.stemBridge);
};

export const desktopSnapshotKeys = {
  projectsList: 'projects:list',
  project(projectId: string): string {
    return `project:${projectId}`;
  },
  versions(projectId: string): string {
    return `project:${projectId}:versions`;
  },
  version(versionId: string): string {
    return `version:${versionId}`;
  },
  comments(versionId: string): string {
    return `version:${versionId}:comments`;
  },
} as const;

export const isLikelyNetworkError = (error: unknown): boolean => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
    request?: unknown;
    response?: unknown;
  };

  if (maybeError.response) {
    return false;
  }

  const code = typeof maybeError.code === 'string' ? maybeError.code : '';
  const message = typeof maybeError.message === 'string' ? maybeError.message : '';

  return (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    /network error|timeout|offline|failed to fetch/i.test(message) ||
    Boolean(maybeError.request)
  );
};

export const readDesktopSnapshot = async <T>(
  key: string,
): Promise<DesktopProjectSnapshot<T> | null> => {
  if (!isDesktopBridgeAvailable()) {
    return null;
  }

  try {
    return await window.stemBridge.cache.getProjectSnapshot<T>(key);
  } catch {
    return null;
  }
};

export const saveDesktopSnapshot = async <T>(key: string, data: T): Promise<void> => {
  if (!isDesktopBridgeAvailable()) {
    return;
  }

  try {
    await window.stemBridge.cache.saveProjectSnapshot({ key, data });
  } catch {
    // Cache writes should never block the online workflow.
  }
};

export const importDesktopUploadFile = async (
  file: File,
): Promise<DesktopCachedUploadFile | null> => {
  if (!isDesktopBridgeAvailable()) {
    return null;
  }

  try {
    return await window.stemBridge.cache.importUploadFile(file);
  } catch {
    return null;
  }
};

export const readDesktopCachedFile = async (
  cachedFileId: string,
): Promise<DesktopCachedFileData> => {
  if (!isDesktopBridgeAvailable()) {
    throw new Error('Desktop file cache is unavailable.');
  }

  return window.stemBridge.cache.readCachedFile(cachedFileId);
};

export const markDesktopDawCandidatesImported = async (
  candidateIds: string[],
): Promise<DesktopDawFileCandidate[]> => {
  if (!isDesktopBridgeAvailable() || candidateIds.length === 0) {
    return [];
  }

  return window.stemBridge.daw.markCandidatesImported(candidateIds);
};

export const enqueueDesktopQueueItem = async <TPayload>(
  type: DesktopQueueItem<TPayload>['type'],
  payload: TPayload,
): Promise<DesktopQueueItem<TPayload> | null> => {
  if (!isDesktopBridgeAvailable()) {
    return null;
  }

  return window.stemBridge.queue.enqueue({ type, payload });
};

export const getPendingDesktopQueueItems = async (): Promise<DesktopQueueItem[]> => {
  if (!isDesktopBridgeAvailable()) {
    return [];
  }

  return window.stemBridge.queue.list();
};
