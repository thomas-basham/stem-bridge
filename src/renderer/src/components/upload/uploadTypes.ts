import type { VersionFileAssetType } from '@/types/api';

export interface PendingUploadFile {
  id: string;
  file: File;
  type: VersionFileAssetType;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}
