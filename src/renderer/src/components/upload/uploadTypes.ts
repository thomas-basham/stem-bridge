import type { DesktopCachedUploadFile } from '@shared/types';
import type { VersionFileAssetType } from '@/types/api';

export interface PendingUploadFile {
  id: string;
  dawCandidateId?: string;
  file: File;
  cachedFile?: DesktopCachedUploadFile;
  type: VersionFileAssetType;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}
