import { useState } from 'react';
import { Badge, Button, EmptyState, LoadingSpinner, useToast } from '@/components/ui';
import { FILE_TYPE_LABELS } from '@/constants/app-constants';
import { useDawBridge, type ImportedDawFile } from '@/hooks/useDawBridge';

interface AbletonWatchPanelProps {
  onImportFiles: (files: ImportedDawFile[]) => void;
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

const formatModifiedDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
};

export function AbletonWatchPanel({ onImportFiles }: AbletonWatchPanelProps) {
  const toast = useToast();
  const dawBridge = useDawBridge();
  const [importingCandidateId, setImportingCandidateId] = useState<string | null>(null);
  const [isImportingAll, setIsImportingAll] = useState(false);
  const activeCandidates = dawBridge.candidates.filter((candidate) => !candidate.imported);
  const visibleCandidates = activeCandidates.slice(0, 8);

  const handleImportCandidate = async (candidateId: string): Promise<void> => {
    setImportingCandidateId(candidateId);

    try {
      const importedFile = await dawBridge.cacheCandidate(candidateId);
      onImportFiles([importedFile]);
      toast.success('DAW export imported', `${importedFile.cachedFile.fileName} is ready to upload.`);
    } catch (error) {
      toast.error(
        'Import failed',
        error instanceof Error ? error.message : 'Unable to import DAW export.',
      );
    } finally {
      setImportingCandidateId(null);
    }
  };

  const handleImportAllCandidates = async (): Promise<void> => {
    if (activeCandidates.length === 0) {
      return;
    }

    setIsImportingAll(true);

    try {
      const importedFiles = await dawBridge.cacheCandidates(
        activeCandidates.map((candidate) => candidate.id),
      );
      onImportFiles(importedFiles);
      toast.success(
        'DAW exports imported',
        `${importedFiles.length} files are ready to upload.`,
      );
    } catch (error) {
      toast.error(
        'Import failed',
        error instanceof Error ? error.message : 'Unable to import DAW exports.',
      );
    } finally {
      setIsImportingAll(false);
    }
  };

  return (
    <section className="daw-watch-panel">
      <header className="daw-watch-panel__header">
        <div>
          <h4>Ableton Watch Folder</h4>
          <p>Detected exports can be reviewed and uploaded to the latest or a new version.</p>
        </div>
        <div className="daw-watch-panel__actions">
          {activeCandidates.length > 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void handleImportAllCandidates()}
              isLoading={isImportingAll}
              loadingLabel="Importing..."
              disabled={importingCandidateId !== null}
            >
              Import all
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void dawBridge.chooseFolder()}
            isLoading={dawBridge.isLoading}
            loadingLabel="Choosing..."
            disabled={isImportingAll}
          >
            Choose Folder
          </Button>
        </div>
      </header>

      {dawBridge.errorMessage ? (
        <p className="daw-watch-panel__error" role="alert">
          {dawBridge.errorMessage}
        </p>
      ) : null}

      {dawBridge.folders.length > 0 ? (
        <ul className="daw-watch-panel__folders">
          {dawBridge.folders.map((folder) => (
            <li key={folder.id}>
              <div>
                <strong>{folder.label}</strong>
                <span>{folder.path}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void dawBridge.removeFolder(folder.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {dawBridge.isLoading && dawBridge.folders.length === 0 ? (
        <div className="daw-watch-panel__loading">
          <LoadingSpinner label="Scanning Ableton exports..." size="sm" />
        </div>
      ) : null}

      {!dawBridge.isLoading && dawBridge.folders.length === 0 ? (
        <EmptyState
          title="No Ableton folder selected"
          description="Choose an Ableton project or export folder to watch for WAV, AIFF, MP3, FLAC, and MIDI files."
        />
      ) : null}

      {dawBridge.folders.length > 0 && activeCandidates.length === 0 ? (
        <EmptyState
          title="No new exports detected"
          description="New audio and MIDI files in the watched folder will appear here."
        />
      ) : null}

      {activeCandidates.length > 0 ? (
        <ul className="daw-watch-panel__candidates">
          {visibleCandidates.map((candidate) => (
            <li key={candidate.id}>
              <div className="daw-watch-panel__candidate-main">
                <strong>{candidate.name}</strong>
                <span>
                  {formatFileSize(candidate.sizeBytes)} · Modified {formatModifiedDate(candidate.modifiedAt)}
                </span>
              </div>
              <Badge tone={candidate.type === 'MIX' ? 'teal' : 'neutral'}>
                {FILE_TYPE_LABELS[candidate.type]}
              </Badge>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleImportCandidate(candidate.id)}
                isLoading={importingCandidateId === candidate.id}
                loadingLabel="Importing..."
                disabled={isImportingAll}
              >
                Import
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {activeCandidates.length > visibleCandidates.length ? (
        <p className="daw-watch-panel__summary">
          Showing {visibleCandidates.length} of {activeCandidates.length} detected exports. Import all includes every detected file.
        </p>
      ) : null}
    </section>
  );
}
