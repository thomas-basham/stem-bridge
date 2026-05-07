import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { desktopChannels, type DesktopMetadata } from '@shared/types';
import { DesktopStore } from './desktop-store';

const isSafeExternalUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch {
    return false;
  }
};

const isAppNavigationUrl = (url: string): boolean => {
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    return url.startsWith(process.env.ELECTRON_RENDERER_URL);
  }

  return url.startsWith('file://');
};

const createMainWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1240,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#071018',
    title: 'StemBridge',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppNavigationUrl(url)) {
      return;
    }

    event.preventDefault();

    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
};

const registerIpcHandlers = (desktopStore: DesktopStore): void => {
  ipcMain.handle(desktopChannels.getMetadata, (): DesktopMetadata => {
    return {
      appName: app.getName(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
    };
  });

  ipcMain.handle(desktopChannels.getNetworkStatus, () => desktopStore.getNetworkStatus());

  ipcMain.handle(desktopChannels.getProjectSnapshot, (_event, key: string) => {
    return desktopStore.getProjectSnapshot(key);
  });

  ipcMain.handle(desktopChannels.saveProjectSnapshot, (_event, snapshot) => {
    return desktopStore.saveProjectSnapshot(snapshot);
  });

  ipcMain.handle(desktopChannels.importUploadFile, (_event, payload: { path: string; name?: string }) => {
    return desktopStore.importUploadFile(payload.path, payload.name);
  });

  ipcMain.handle(desktopChannels.readCachedFile, (_event, cachedFileId: string) => {
    return desktopStore.readCachedFile(cachedFileId);
  });

  ipcMain.handle(desktopChannels.listQueue, () => desktopStore.listQueue());

  ipcMain.handle(desktopChannels.enqueueQueueItem, (_event, item) => {
    return desktopStore.enqueueQueueItem(item);
  });

  ipcMain.handle(desktopChannels.updateQueueItem, (_event, itemId: string, patch) => {
    return desktopStore.updateQueueItem(itemId, patch);
  });

  ipcMain.handle(desktopChannels.retryQueue, () => desktopStore.retryQueue());

  ipcMain.handle(desktopChannels.chooseWatchFolder, () => desktopStore.chooseWatchFolder());

  ipcMain.handle(desktopChannels.listWatchFolders, () => desktopStore.listWatchFolders());

  ipcMain.handle(desktopChannels.removeWatchFolder, (_event, folderId: string) => {
    return desktopStore.removeWatchFolder(folderId);
  });

  ipcMain.handle(desktopChannels.listDawCandidates, () => desktopStore.listDawCandidates());

  ipcMain.handle(desktopChannels.importDawCandidate, (_event, candidateId: string) => {
    return desktopStore.importDawCandidate(candidateId);
  });

  ipcMain.handle(desktopChannels.cacheDawCandidate, (_event, candidateId: string) => {
    return desktopStore.cacheDawCandidate(candidateId);
  });

  ipcMain.handle(desktopChannels.markDawCandidatesImported, (_event, candidateIds: string[]) => {
    return desktopStore.markDawCandidatesImported(candidateIds);
  });
};

app.whenReady().then(() => {
  const desktopStore = new DesktopStore(join(app.getPath('userData'), 'StemBridge'));
  registerIpcHandlers(desktopStore);
  void desktopStore.initialize();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
