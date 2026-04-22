import { contextBridge, ipcRenderer } from 'electron';
import { desktopChannels, type StemBridgeDesktopApi } from '@shared/types';

const desktopApi: StemBridgeDesktopApi = {
  app: {
    getMetadata: () => ipcRenderer.invoke(desktopChannels.getMetadata),
  },
};

contextBridge.exposeInMainWorld('stemBridge', desktopApi);
