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
}
