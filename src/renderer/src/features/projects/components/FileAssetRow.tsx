import { useState } from 'react';
import { Badge } from '@/components/ui';
import { versionsService } from '@/features/projects/versionsService';
import type { VersionFileAsset } from '@/types/api';

interface FileAssetRowProps {
  versionId: string;
  fileAsset: VersionFileAsset;
  isWaveformSource?: boolean;
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

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
};

export function FileAssetRow({
  versionId,
  fileAsset,
  isWaveformSource = false,
}: FileAssetRowProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const hasDistinctOriginalName =
    fileAsset.originalName.trim().length > 0 && fileAsset.originalName !== fileAsset.name;

  const handleDownload = async (): Promise<void> => {
    setDownloadState('loading');
    setDownloadError(null);

    try {
      const download = await versionsService.downloadFile({ versionId, fileAsset });
      triggerBlobDownload(download.blob, download.fileName);
      setDownloadState('idle');
    } catch (error) {
      setDownloadState('error');
      setDownloadError(error instanceof Error ? error.message : 'Unable to download file.');
    }
  };

  return (
    <li className="file-asset-row">
      <div className="file-asset-row__identity">
        <strong>{fileAsset.name}</strong>
        {hasDistinctOriginalName ? <span>Original: {fileAsset.originalName}</span> : null}
        {downloadError ? <span className="file-asset-row__error">{downloadError}</span> : null}
      </div>

      <div className="file-asset-row__meta">
        <Badge tone={fileAsset.type === 'MIX' ? 'teal' : 'neutral'}>{fileAsset.type}</Badge>
        {isWaveformSource ? <Badge tone="amber">Waveform Source</Badge> : null}
        <span>{formatFileSize(fileAsset.sizeBytes)}</span>
        <button
          type="button"
          className="file-asset-row__download"
          onClick={() => void handleDownload()}
          disabled={downloadState === 'loading'}
        >
          {downloadState === 'loading' ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </li>
  );
}
