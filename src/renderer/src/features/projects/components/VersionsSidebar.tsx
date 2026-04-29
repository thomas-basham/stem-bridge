import { useEffect } from 'react';
import { Badge, EmptyState, LoadingSpinner } from '@/components/ui';
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

      {versionsState.status === 'loading' ? (
        <div className="versions-sidebar__loading">
          <LoadingSpinner label="Loading versions..." size="sm" />
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
          description="Version uploads will appear here once the upload flow is connected."
        />
      ) : null}

      {versionsState.status === 'success' && versions.length > 0 ? (
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
