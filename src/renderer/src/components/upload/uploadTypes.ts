import type { VersionFileAssetType } from '@/types/api';

export const versionFileTypes: VersionFileAssetType[] = ['STEM', 'MIX', 'MIDI', 'SAMPLE', 'OTHER'];

export interface PendingUploadFile {
  id: string;
  file: File;
  type: VersionFileAssetType;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}
