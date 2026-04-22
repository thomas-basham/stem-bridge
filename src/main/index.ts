import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { desktopChannels, type DesktopMetadata } from '@shared/types';

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
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);

    return { action: 'deny' };
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
};

const registerIpcHandlers = (): void => {
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
};

app.whenReady().then(() => {
  registerIpcHandlers();
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
