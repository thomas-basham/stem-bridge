import type {
  DesktopQueueItem,
  DesktopQueuedCommentPayload,
  DesktopQueuedFileUploadPayload,
  DesktopQueuedVersionCreatePayload,
} from '@shared/types';
import { RENDERER_STORAGE_KEYS } from '@/constants/app-constants';
import { commentsApi, projectsApi, versionsApi } from '@/lib/api';
import { readDesktopCachedFile } from '@/lib/desktop';

type VersionIdMap = Record<string, string>;

const versionMapStorageKey = `${RENDERER_STORAGE_KEYS.authToken}:desktop-version-map`;

const copyBytesToArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
};

const readVersionIdMap = (): VersionIdMap => {
  try {
    const rawValue = window.localStorage.getItem(versionMapStorageKey);
    return rawValue ? (JSON.parse(rawValue) as VersionIdMap) : {};
  } catch {
    return {};
  }
};

const saveVersionIdMap = (versionMap: VersionIdMap): void => {
  window.localStorage.setItem(versionMapStorageKey, JSON.stringify(versionMap));
};

const resolveVersionId = (
  payload: Pick<DesktopQueuedFileUploadPayload, 'versionId' | 'localVersionId'>,
): string | null => {
  if (payload.versionId) {
    return payload.versionId;
  }

  if (!payload.localVersionId) {
    return null;
  }

  return readVersionIdMap()[payload.localVersionId] ?? null;
};

const updateQueueItem = async (
  item: DesktopQueueItem,
  patch: Parameters<typeof window.stemBridge.queue.update>[1],
): Promise<void> => {
  await window.stemBridge.queue.update(item.id, patch);
};

const syncVersionCreate = async (
  item: DesktopQueueItem<DesktopQueuedVersionCreatePayload>,
): Promise<void> => {
  const createdVersion = await projectsApi.createVersion(item.payload.projectId, {
    notes: item.payload.notes,
  });
  const versionMap = readVersionIdMap();
  versionMap[item.payload.localVersionId] = createdVersion.id;
  saveVersionIdMap(versionMap);
};

const syncFileUpload = async (
  item: DesktopQueueItem<DesktopQueuedFileUploadPayload>,
): Promise<void> => {
  const versionId = resolveVersionId(item.payload);

  if (!versionId) {
    throw new Error('Waiting for the offline version to sync first.');
  }

  const cachedFile = await readDesktopCachedFile(item.payload.cachedFileId);
  const file = new File([copyBytesToArrayBuffer(cachedFile.data)], item.payload.fileName, {
    type: item.payload.mimeType || cachedFile.mimeType || 'application/octet-stream',
  });

  await versionsApi.uploadFile(versionId, {
    file,
    type: item.payload.fileType,
  });
};

const syncComment = async (item: DesktopQueueItem<DesktopQueuedCommentPayload>): Promise<void> => {
  const versionId = resolveVersionId({
    versionId: item.payload.versionId,
  });

  if (!versionId) {
    throw new Error('Waiting for the offline version to sync first.');
  }

  await commentsApi.create(versionId, {
    text: item.payload.text,
    timestampSeconds: item.payload.timestampSeconds,
  });
};

const syncQueueItem = async (item: DesktopQueueItem): Promise<void> => {
  if (item.type === 'version-create') {
    await syncVersionCreate(item as DesktopQueueItem<DesktopQueuedVersionCreatePayload>);
    return;
  }

  if (item.type === 'file-upload') {
    await syncFileUpload(item as DesktopQueueItem<DesktopQueuedFileUploadPayload>);
    return;
  }

  await syncComment(item as DesktopQueueItem<DesktopQueuedCommentPayload>);
};

export const syncDesktopQueueOnce = async (): Promise<void> => {
  if (!window.stemBridge || !navigator.onLine) {
    return;
  }

  const queueItems = await window.stemBridge.queue.list();
  const syncableItems = queueItems
    .filter((item) => item.status === 'pending')
    .sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });

  for (const item of syncableItems) {
    try {
      await updateQueueItem(item, {
        status: 'syncing',
        errorMessage: undefined,
      });
      await syncQueueItem(item);
      await updateQueueItem(item, {
        status: 'complete',
        errorMessage: undefined,
      });
    } catch (error) {
      await updateQueueItem(item, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unable to sync queued item.',
      });
    }
  }
};
