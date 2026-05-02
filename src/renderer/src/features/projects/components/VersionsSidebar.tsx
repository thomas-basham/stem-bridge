import { useEffect } from 'react';
import { Badge, EmptyState, LoadingSpinner, Skeleton } from '@/components/ui';
import { VersionListItem } from '@/features/projects/components/VersionListItem';
import type { UseProjectVersionsResult } from '@/features/projects/useProjectVersions';

interface VersionsSidebarProps {
  versionsState: UseProjectVersionsResult;
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
}

export function VersionsSidebar({
  versionsState,
  selectedVersionId,
  onSelectVersion,
}: VersionsSidebarProps) {
  const versions = versionsState.data;
  const hasCachedVersions = versions.length > 0;

  useEffect(() => {
    if (versionsState.status !== 'success') {
      return;
    }

    if (versions.length === 0) {
      onSelectVersion(null);
      return;
    }

    const selectedVersionExists = versions.some((version) => version.id === selectedVersionId);

    if (!selectedVersionExists) {
      onSelectVersion(versions[0].id);
    }
  }, [onSelectVersion, selectedVersionId, versions, versionsState.status]);

  return (
    <aside className="project-detail-panel project-detail-panel--versions">
      <div className="project-detail-panel__header">
        <div>
          <h4>Versions</h4>
          <p>{versionsState.status === 'success' ? `${versions.length} saved revisions` : 'Loading revisions'}</p>
        </div>
        <Badge tone={versions.length > 0 ? 'teal' : 'amber'}>{versions.length}</Badge>
      </div>

      {versionsState.status === 'loading' && !hasCachedVersions ? (
        <div className="versions-sidebar__loading">
          <div className="versions-sidebar__skeleton-list">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="version-list-item version-list-item--skeleton">
                <Skeleton width="42%" height={16} />
                <Skeleton width="76%" height={18} />
                <Skeleton width="54%" height={12} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {versionsState.status === 'loading' && hasCachedVersions ? (
        <div className="inline-loading">
          <LoadingSpinner label="Refreshing versions..." size="sm" />
        </div>
      ) : null}

      {versionsState.status === 'error' ? (
        <EmptyState
          tone="error"
          title="Versions unavailable"
          description={versionsState.errorMessage}
        />
      ) : null}

      {versionsState.status === 'success' && versions.length === 0 ? (
        <EmptyState
          title="No versions yet"
          description="Upload the first version to start collecting mixes, stems, notes, and timestamped feedback."
        />
      ) : null}

      {(versionsState.status === 'success' || hasCachedVersions) && versions.length > 0 ? (
        <div className="versions-list">
          {versions.map((version) => (
            <VersionListItem
              key={version.id}
              version={version}
              selected={version.id === selectedVersionId}
              onSelect={onSelectVersion}
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
}
