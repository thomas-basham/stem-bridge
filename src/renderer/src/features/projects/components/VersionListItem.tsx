import type { SongVersion } from '@/types/api';
import { formatProjectDate, getUserLabel } from './project-detail-format';

interface VersionListItemProps {
  version: SongVersion;
  selected: boolean;
  onSelect: (versionId: string) => void;
}

const getNotesPreview = (notes: string | null | undefined): string => {
  const normalizedNotes = notes?.trim();

  if (!normalizedNotes) {
    return 'No notes added for this version.';
  }

  return normalizedNotes.length > 92 ? `${normalizedNotes.slice(0, 89)}...` : normalizedNotes;
};

export function VersionListItem({ version, selected, onSelect }: VersionListItemProps) {
  return (
    <button
      className={selected ? 'version-list-item version-list-item--active' : 'version-list-item'}
      type="button"
      onClick={() => onSelect(version.id)}
      aria-pressed={selected}
    >
      <span className="version-list-item__number">Version {version.versionNumber}</span>
      <strong>{getUserLabel(version.createdBy)}</strong>
      <span>{formatProjectDate(version.createdAt)}</span>
      <p>{getNotesPreview(version.notes)}</p>
    </button>
  );
}
