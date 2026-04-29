import type { VersionFileAsset, VersionFileAssetType } from '@/types/api';
import { FileAssetRow } from './FileAssetRow';

interface FileGroupSectionProps {
  versionId: string;
  type: VersionFileAssetType;
  files: VersionFileAsset[];
  waveformFileId?: string;
}

export function FileGroupSection({
  versionId,
  type,
  files,
  waveformFileId,
}: FileGroupSectionProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className="file-group-section">
      <header className="file-group-section__header">
        <h5>{type}</h5>
        <span>
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
      </header>
      <ul className="file-group-section__list">
        {files.map((fileAsset) => (
          <FileAssetRow
            key={fileAsset.id}
            versionId={versionId}
            fileAsset={fileAsset}
            isWaveformSource={fileAsset.id === waveformFileId}
          />
        ))}
      </ul>
    </section>
  );
}
