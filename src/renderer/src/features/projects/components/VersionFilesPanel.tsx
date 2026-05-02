import { EmptyState } from '@/components/ui';
import {
  FILE_TYPE_LABELS,
  PRIMARY_MIX_FILE_TYPE,
  VERSION_FILE_TYPES,
} from '@/constants/app-constants';
import type { VersionFileAsset, VersionFileAssetType } from '@/types/api';
import { FileGroupSection } from './FileGroupSection';

interface VersionFilesPanelProps {
  versionId: string;
  files: VersionFileAsset[];
}

const groupFilesByType = (
  files: VersionFileAsset[],
): Record<VersionFileAssetType, VersionFileAsset[]> => {
  const groups: Record<VersionFileAssetType, VersionFileAsset[]> = {
    MIX: [],
    STEM: [],
    MIDI: [],
    SAMPLE: [],
    OTHER: [],
  };

  files.forEach((fileAsset) => {
    groups[fileAsset.type].push(fileAsset);
  });

  return groups;
};

const versionFileTypesDescription = [
  `${FILE_TYPE_LABELS.MIX.toLowerCase()}es`,
  `${FILE_TYPE_LABELS.STEM.toLowerCase()}s`,
  FILE_TYPE_LABELS.MIDI,
  `${FILE_TYPE_LABELS.SAMPLE.toLowerCase()}s`,
].join(', ');

export function VersionFilesPanel({ versionId, files }: VersionFilesPanelProps) {
  const groupedFiles = groupFilesByType(files);
  const waveformFile = groupedFiles[PRIMARY_MIX_FILE_TYPE][0];

  return (
    <section className="version-files-panel">
      <header className="version-files-panel__header">
        <div>
          <h4>Files</h4>
          <p>
            {waveformFile
              ? `${waveformFile.name} is marked as the mix source for waveform playback.`
              : `Upload a ${FILE_TYPE_LABELS[PRIMARY_MIX_FILE_TYPE]} file to drive waveform playback.`}
          </p>
        </div>
      </header>

      {files.length === 0 ? (
        <EmptyState
          title="No files uploaded"
          description={`Uploaded ${versionFileTypesDescription}, and other files will appear here.`}
        />
      ) : (
        <div className="version-files-panel__groups">
          {VERSION_FILE_TYPES.map((type) => (
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
