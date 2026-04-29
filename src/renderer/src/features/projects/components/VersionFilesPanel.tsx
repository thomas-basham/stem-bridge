import { EmptyState } from '@/components/ui';
import type { VersionFileAsset, VersionFileAssetType } from '@/types/api';
import { FileGroupSection } from './FileGroupSection';

interface VersionFilesPanelProps {
  versionId: string;
  files: VersionFileAsset[];
}

const fileTypeOrder: VersionFileAssetType[] = ['MIX', 'STEM', 'MIDI', 'SAMPLE', 'OTHER'];

const groupFilesByType = (files: VersionFileAsset[]): Record<VersionFileAssetType, VersionFileAsset[]> => {
  return fileTypeOrder.reduce(
    (groups, type) => {
      groups[type] = files.filter((fileAsset) => fileAsset.type === type);
      return groups;
    },
    {} as Record<VersionFileAssetType, VersionFileAsset[]>,
  );
};

export function VersionFilesPanel({ versionId, files }: VersionFilesPanelProps) {
  const groupedFiles = groupFilesByType(files);
  const waveformFile = groupedFiles.MIX[0];

  return (
    <section className="version-files-panel">
      <header className="version-files-panel__header">
        <div>
          <h4>Files</h4>
          <p>
            {waveformFile
              ? `${waveformFile.name} is marked as the mix source for waveform playback.`
              : 'Upload a MIX file to drive waveform playback.'}
          </p>
        </div>
      </header>

      {files.length === 0 ? (
        <EmptyState
          title="No files uploaded"
          description="Uploaded mixes, stems, MIDI, samples, and other files will appear here."
        />
      ) : (
        <div className="version-files-panel__groups">
          {fileTypeOrder.map((type) => (
            <FileGroupSection
              key={type}
              versionId={versionId}
              type={type}
              files={groupedFiles[type]}
              waveformFileId={waveformFile?.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
