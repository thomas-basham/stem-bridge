import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { desktopChannels, type StemBridgeDesktopApi } from '@shared/types';

const desktopApi: StemBridgeDesktopApi = {
  app: {
    getMetadata: () => ipcRenderer.invoke(desktopChannels.getMetadata),
  },
  network: {
    getStatus: () => ipcRenderer.invoke(desktopChannels.getNetworkStatus),
  },
  cache: {
    getProjectSnapshot: (key) => ipcRenderer.invoke(desktopChannels.getProjectSnapshot, key),
    saveProjectSnapshot: (snapshot) =>
      ipcRenderer.invoke(desktopChannels.saveProjectSnapshot, snapshot),
    importUploadFile: (file) => {
      if (!(file instanceof File)) {
        return Promise.reject(new Error('A browser File is required.'));
      }

      const path = webUtils.getPathForFile(file);

      if (!path) {
        return Promise.reject(new Error('Unable to resolve the selected file path.'));
      }

      return ipcRenderer.invoke(desktopChannels.importUploadFile, {
        path,
        name: file.name,
      });
    },
    readCachedFile: (cachedFileId) => ipcRenderer.invoke(desktopChannels.readCachedFile, cachedFileId),
  },
  queue: {
    list: () => ipcRenderer.invoke(desktopChannels.listQueue),
    enqueue: (item) => ipcRenderer.invoke(desktopChannels.enqueueQueueItem, item),
    update: (itemId, patch) => ipcRenderer.invoke(desktopChannels.updateQueueItem, itemId, patch),
    retryAll: () => ipcRenderer.invoke(desktopChannels.retryQueue),
    onChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, items: unknown): void => {
        callback(items as Parameters<typeof callback>[0]);
      };

      ipcRenderer.on(desktopChannels.queueChanged, listener);
      return () => ipcRenderer.removeListener(desktopChannels.queueChanged, listener);
    },
  },
  daw: {
    chooseWatchFolder: () => ipcRenderer.invoke(desktopChannels.chooseWatchFolder),
    listWatchFolders: () => ipcRenderer.invoke(desktopChannels.listWatchFolders),
    removeWatchFolder: (folderId) => ipcRenderer.invoke(desktopChannels.removeWatchFolder, folderId),
    listCandidates: () => ipcRenderer.invoke(desktopChannels.listDawCandidates),
    importCandidate: (candidateId) =>
      ipcRenderer.invoke(desktopChannels.importDawCandidate, candidateId),
    cacheCandidate: (candidateId) =>
      ipcRenderer.invoke(desktopChannels.cacheDawCandidate, candidateId),
    markCandidatesImported: (candidateIds) =>
      ipcRenderer.invoke(desktopChannels.markDawCandidatesImported, candidateIds),
    onCandidatesChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, candidates: unknown): void => {
        callback(candidates as Parameters<typeof callback>[0]);
      };

      ipcRenderer.on(desktopChannels.dawCandidatesChanged, listener);
      return () => ipcRenderer.removeListener(desktopChannels.dawCandidatesChanged, listener);
    },
  },
};

contextBridge.exposeInMainWorld('stemBridge', desktopApi);
