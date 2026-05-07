import { useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { useProjectVersions } from '@/features/projects/useProjectVersions';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectInfoPanel } from './ProjectInfoPanel';
import { VersionsSidebar } from './VersionsSidebar';
import { ProjectWorkspaceMain } from './ProjectWorkspaceMain';
import { UploadVersionModal } from './UploadVersionModal';
import { AbletonWatchPanel } from './AbletonWatchPanel';
import type { ImportedDawFile } from '@/hooks/useDawBridge';
import type { SongVersion } from '@/types/api';

interface ProjectDetailShellProps {
  project: ProjectSummary;
}

const getLatestVersion = (
  versions: SongVersion[],
): Pick<SongVersion, 'id' | 'versionNumber' | 'createdAt'> | null => {
  if (versions.length === 0) {
    return null;
  }

  return [...versions].sort((left, right) => {
    if (left.versionNumber !== right.versionNumber) {
      return right.versionNumber - left.versionNumber;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  })[0];
};

export function ProjectDetailShell({ project }: ProjectDetailShellProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    project.latestVersion?.id ?? null,
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [importedDawFiles, setImportedDawFiles] = useState<ImportedDawFile[]>([]);
  const [importedDawFilesKey, setImportedDawFilesKey] = useState(0);
  const versionsState = useProjectVersions(project.id);
  const latestVersion =
    getLatestVersion(versionsState.data) ??
    (project.latestVersion
      ? {
          id: project.latestVersion.id,
          versionNumber: project.latestVersion.versionNumber,
          createdAt: project.latestVersion.createdAt,
        }
      : null);

  const handleUploadComplete = async (versionId: string): Promise<void> => {
    const refreshedVersions = await versionsState.refresh();
    const uploadedVersionExists = refreshedVersions.some((version) => version.id === versionId);

    setSelectedVersionId((currentVersionId) => {
      if (uploadedVersionExists) {
        return versionId;
      }

      const currentVersionStillExists = refreshedVersions.some((version) => {
        return version.id === currentVersionId;
      });

      return currentVersionStillExists ? currentVersionId : refreshedVersions[0]?.id ?? null;
    });
  };

  const handleImportDawFiles = (files: ImportedDawFile[]): void => {
    setImportedDawFiles(files);
    setImportedDawFilesKey((currentKey) => currentKey + 1);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = (): void => {
    setIsUploadModalOpen(false);
    setImportedDawFiles([]);
  };

  return (
    <section className="project-detail-shell">
      <ProjectDetailHeader project={project} onOpenUpload={() => setIsUploadModalOpen(true)} />
      <div className="project-detail-grid">
        <VersionsSidebar
          versionsState={versionsState}
          selectedVersionId={selectedVersionId}
          onSelectVersion={setSelectedVersionId}
        />
        <ProjectWorkspaceMain project={project} selectedVersionId={selectedVersionId} />
        <ProjectInfoPanel project={project} />
      </div>

      <AbletonWatchPanel onImportFiles={handleImportDawFiles} />

      <UploadVersionModal
        open={isUploadModalOpen}
        projectId={project.id}
        latestVersion={latestVersion}
        initialFiles={importedDawFiles}
        initialFilesKey={importedDawFilesKey}
        onClose={handleCloseUploadModal}
        onComplete={handleUploadComplete}
      />
    </section>
  );
}
