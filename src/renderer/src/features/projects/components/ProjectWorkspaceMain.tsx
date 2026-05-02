import { useCallback, useRef, useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { EmptyState, LoadingSpinner } from '@/components/ui';
import { WaveformPlayer, type WaveformPlayerHandle } from '@/components/player/WaveformPlayer';
import { useVersionDetails } from '@/features/projects/useVersionDetails';
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
