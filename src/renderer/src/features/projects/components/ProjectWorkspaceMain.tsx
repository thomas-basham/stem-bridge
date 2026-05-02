import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { Button, EmptyState, LoadingSpinner } from '@/components/ui';
import { WaveformPlayer, type WaveformPlayerHandle } from '@/components/player/WaveformPlayer';
import { useVersionDetails } from '@/features/projects/useVersionDetails';
import { versionsService } from '@/features/projects/versionsService';
import { triggerBlobDownload } from '@/lib/file-download';
import { CommentsPanel } from './CommentsPanel';
import { VersionFilesPanel } from './VersionFilesPanel';
import { formatProjectDate, getUserLabel } from './project-detail-format';

interface ProjectWorkspaceMainProps {
  project: ProjectSummary;
  selectedVersionId: string | null;
}

export function ProjectWorkspaceMain({ project, selectedVersionId }: ProjectWorkspaceMainProps) {
  const waveformRef = useRef<WaveformPlayerHandle | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [zipDownloadState, setZipDownloadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [zipDownloadError, setZipDownloadError] = useState<string | null>(null);
  const versionState = useVersionDetails(selectedVersionId);
  const selectedVersion = versionState.status === 'success' ? versionState.data : null;
  const primaryMixFile = selectedVersion?.fileAssets?.find((fileAsset) => fileAsset.type === 'MIX');
  const handleWaveformTimeChange = useCallback((timeSeconds: number): void => {
    setCurrentPlaybackTime((previousTime) => {
      if (timeSeconds === 0 || Math.abs(previousTime - timeSeconds) >= 0.25) {
        return timeSeconds;
      }

      return previousTime;
    });
  }, []);

  const handleSeekComment = useCallback((timestampSeconds: number): void => {
    waveformRef.current?.seekTo(timestampSeconds);
    setCurrentPlaybackTime(timestampSeconds);
  }, []);

  useEffect(() => {
    setZipDownloadState('idle');
    setZipDownloadError(null);
  }, [selectedVersionId]);

  const handleDownloadVersionZip = async (): Promise<void> => {
    if (!selectedVersion) {
      return;
    }

    setZipDownloadState('loading');
    setZipDownloadError(null);

    try {
      const download = await versionsService.downloadVersionZip(selectedVersion.id);
      triggerBlobDownload(download.blob, download.fileName);
      setZipDownloadState('idle');
    } catch (error) {
      setZipDownloadState('error');
      setZipDownloadError(error instanceof Error ? error.message : 'Unable to download version ZIP.');
    }
  };

  return (
    <main className="project-detail-panel project-detail-panel--workspace">
      <div className="project-detail-panel__header">
        <div>
          <h4>Waveform & Comments</h4>
          <p>
            {selectedVersion
              ? `Previewing version ${selectedVersion.versionNumber}`
              : 'Select a version to inspect its notes, files, and comments'}
          </p>
        </div>
        {selectedVersion ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleDownloadVersionZip()}
            disabled={zipDownloadState === 'loading'}
          >
            {zipDownloadState === 'loading' ? 'Preparing ZIP...' : 'Download Version ZIP'}
          </Button>
        ) : null}
      </div>

      {versionState.status === 'idle' ? (
        <EmptyState
          title="No version selected"
          description={
            project.versionCount > 0
              ? 'Choose a version from the sidebar to load its details.'
              : 'Versions will be available here after the first upload.'
          }
        />
      ) : null}

      {versionState.status === 'loading' ? (
        <div className="loading-state">
          <LoadingSpinner label="Loading version details..." />
        </div>
      ) : null}

      {versionState.status === 'error' ? (
        <EmptyState
          tone="error"
          title="Version unavailable"
          description={versionState.errorMessage}
        />
      ) : null}

      {selectedVersion ? (
        <>
          <div className="selected-version-summary">
            <div>
              <span>Selected Version</span>
              <strong>Version {selectedVersion.versionNumber}</strong>
            </div>
            <div>
              <span>Created By</span>
              <strong>{getUserLabel(selectedVersion.createdBy)}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatProjectDate(selectedVersion.createdAt)}</strong>
            </div>
          </div>

          <WaveformPlayer
            ref={waveformRef}
            versionId={selectedVersion.id}
            mixFile={primaryMixFile}
            onTimeChange={handleWaveformTimeChange}
          />

          {zipDownloadError ? (
            <p className="version-download-error" role="alert">
              {zipDownloadError}
            </p>
          ) : null}

          <div className="version-notes-panel">
            <span>Notes</span>
            <p>{selectedVersion.notes?.trim() || 'No notes were added for this version.'}</p>
          </div>

          <VersionFilesPanel
            versionId={selectedVersion.id}
            files={selectedVersion.fileAssets ?? []}
          />

          <CommentsPanel
            versionId={selectedVersion.id}
            currentTimeSeconds={currentPlaybackTime}
            onSeekComment={handleSeekComment}
          />
        </>
      ) : null}
    </main>
  );
}
