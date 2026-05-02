import { useState } from 'react';
import { Badge, useToast } from '@/components/ui';
import { FILE_TYPE_LABELS, PRIMARY_MIX_FILE_TYPE } from '@/constants/app-constants';
import { versionsService } from '@/features/projects/versionsService';
import { triggerBlobDownload } from '@/lib/file-download';
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

export function FileAssetRow({
  versionId,
  fileAsset,
  isWaveformSource = false,
}: FileAssetRowProps) {
  const toast = useToast();
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
      toast.success('Download started', download.fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download file.';
      setDownloadState('error');
      setDownloadError(message);
      toast.error('Download failed', message);
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
        <Badge tone={fileAsset.type === PRIMARY_MIX_FILE_TYPE ? 'teal' : 'neutral'}>
          {FILE_TYPE_LABELS[fileAsset.type]}
        </Badge>
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
