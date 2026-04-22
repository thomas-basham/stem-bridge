export const desktopChannels = {
  getMetadata: 'app:get-metadata',
} as const;

export interface DesktopMetadata {
  appName: string;
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  platform: string;
}

export type ProjectStatus = 'Tracking' | 'Mix Prep' | 'In Review';

export interface ProjectSummary {
  id: string;
  title: string;
  owner: string;
  collaboratorCount: number;
  versionCount: number;
  lastUpdated: string;
  status: ProjectStatus;
}

export interface StemBridgeDesktopApi {
  app: {
    getMetadata: () => Promise<DesktopMetadata>;
  };
}
