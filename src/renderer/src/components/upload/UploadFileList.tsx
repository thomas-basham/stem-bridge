import { FILE_TYPE_LABELS, UPLOAD_FILE_TYPES } from '@/constants/app-constants';
import type { PendingUploadFile } from './uploadTypes';
import type { VersionFileAssetType } from '@/types/api';

interface UploadFileListProps {
  files: PendingUploadFile[];
  disabled?: boolean;
  onRemove: (fileId: string) => void;
  onTypeChange: (fileId: string, type: VersionFileAssetType) => void;
}

const formatFileSize = (sizeBytes: number): string => {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UploadFileList({
  files,
  disabled = false,
  onRemove,
  onTypeChange,
}: UploadFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="upload-file-list">
      {files.map((uploadFile) => (
        <li key={uploadFile.id} className="upload-file-list__item">
          <div className="upload-file-list__main">
            <strong>{uploadFile.file.name}</strong>
            <span>{formatFileSize(uploadFile.file.size)}</span>
            {uploadFile.errorMessage ? (
              <p className="upload-file-list__error">{uploadFile.errorMessage}</p>
            ) : null}
          </div>

          <label className="upload-file-list__type">
            <span>Type</span>
            <select
              value={uploadFile.type}
              onChange={(event) =>
                onTypeChange(uploadFile.id, event.target.value as VersionFileAssetType)
              }
              disabled={disabled || uploadFile.status === 'uploading' || uploadFile.status === 'success'}
            >
              {UPLOAD_FILE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {FILE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <div className="upload-file-list__progress" aria-label={`${uploadFile.file.name} upload progress`}>
            <span style={{ width: `${uploadFile.progress}%` }} />
          </div>

          <button
            type="button"
            className="upload-file-list__remove"
            onClick={() => onRemove(uploadFile.id)}
            disabled={disabled || uploadFile.status === 'uploading'}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
