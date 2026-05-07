import { useCallback, useEffect, useState } from 'react';
import type {
  DesktopCachedUploadFile,
  DesktopDawFileCandidate,
  DesktopWatchedFolder,
} from '@shared/types';
import { isDesktopBridgeAvailable, readDesktopCachedFile } from '@/lib/desktop';
import type { VersionFileAssetType } from '@/types/api';

export interface ImportedDawFile {
  candidateId: string;
  file: File;
  cachedFile: DesktopCachedUploadFile;
  type: VersionFileAssetType;
}

const copyBytesToArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
};

interface DawBridgeState {
  folders: DesktopWatchedFolder[];
  candidates: DesktopDawFileCandidate[];
  isLoading: boolean;
  errorMessage: string | null;
  chooseFolder: () => Promise<void>;
  removeFolder: (folderId: string) => Promise<void>;
  cacheCandidate: (candidateId: string) => Promise<ImportedDawFile>;
  cacheCandidates: (candidateIds: string[]) => Promise<ImportedDawFile[]>;
  importCandidate: (candidateId: string) => Promise<ImportedDawFile>;
  refresh: () => Promise<void>;
}

export function useDawBridge(): DawBridgeState {
  const [folders, setFolders] = useState<DesktopWatchedFolder[]>([]);
  const [candidates, setCandidates] = useState<DesktopDawFileCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!isDesktopBridgeAvailable()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextFolders, nextCandidates] = await Promise.all([
        window.stemBridge.daw.listWatchFolders(),
        window.stemBridge.daw.listCandidates(),
      ]);
      setFolders(nextFolders);
      setCandidates(nextCandidates);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load DAW exports.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const chooseFolder = useCallback(async (): Promise<void> => {
    if (!isDesktopBridgeAvailable()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await window.stemBridge.daw.chooseWatchFolder();
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to choose Ableton folder.');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const removeFolder = useCallback(
    async (folderId: string): Promise<void> => {
      if (!isDesktopBridgeAvailable()) {
        return;
      }

      await window.stemBridge.daw.removeWatchFolder(folderId);
      await refresh();
    },
    [refresh],
  );

  const createImportedDawFile = useCallback(
    async (
      candidate: DesktopDawFileCandidate,
      cachedFile: DesktopCachedUploadFile,
    ): Promise<ImportedDawFile> => {
      const cachedData = await readDesktopCachedFile(cachedFile.id);
      const file = new File([copyBytesToArrayBuffer(cachedData.data)], cachedFile.fileName, {
        type: cachedFile.mimeType || 'application/octet-stream',
      });

      return {
        candidateId: candidate.id,
        file,
        cachedFile,
        type: candidate.type,
      };
    },
    [],
  );

  const cacheCandidate = useCallback(
    async (candidateId: string): Promise<ImportedDawFile> => {
      if (!isDesktopBridgeAvailable()) {
        throw new Error('Desktop DAW bridge is unavailable.');
      }

      const candidate = candidates.find((item) => item.id === candidateId);

      if (!candidate) {
        throw new Error('DAW export candidate was not found.');
      }

      const cachedFile = await window.stemBridge.daw.cacheCandidate(candidateId);
      const importedFile = await createImportedDawFile(candidate, cachedFile);
      await refresh();

      return importedFile;
    },
    [candidates, createImportedDawFile, refresh],
  );

  const cacheCandidates = useCallback(
    async (candidateIds: string[]): Promise<ImportedDawFile[]> => {
      if (!isDesktopBridgeAvailable()) {
        throw new Error('Desktop DAW bridge is unavailable.');
      }

      const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
      const importedFiles: ImportedDawFile[] = [];

      for (const candidateId of candidateIds) {
        const candidate = candidateById.get(candidateId);

        if (!candidate) {
          throw new Error('DAW export candidate was not found.');
        }

        const cachedFile = await window.stemBridge.daw.cacheCandidate(candidateId);
        importedFiles.push(await createImportedDawFile(candidate, cachedFile));
      }

      await refresh();
      return importedFiles;
    },
    [candidates, createImportedDawFile, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isDesktopBridgeAvailable()) {
      return;
    }

    return window.stemBridge.daw.onCandidatesChanged((nextCandidates) => {
      setCandidates(nextCandidates);
    });
  }, []);

  return {
    folders,
    candidates,
    isLoading,
    errorMessage,
    chooseFolder,
    removeFolder,
    cacheCandidate,
    cacheCandidates,
    importCandidate: cacheCandidate,
    refresh,
  };
}
