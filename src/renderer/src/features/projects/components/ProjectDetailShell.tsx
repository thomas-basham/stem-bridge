import { useState } from 'react';
import type { ProjectSummary } from '@shared/types';
import { useProjectVersions } from '@/features/projects/useProjectVersions';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import { ProjectInfoPanel } from './ProjectInfoPanel';
import { VersionsSidebar } from './VersionsSidebar';
import { ProjectWorkspaceMain } from './ProjectWorkspaceMain';
import { UploadVersionModal } from './UploadVersionModal';

interface ProjectDetailShellProps {
  project: ProjectSummary;
}

export function ProjectDetailShell({ project }: ProjectDetailShellProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    project.latestVersion?.id ?? null,
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const versionsState = useProjectVersions(project.id);

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

      <UploadVersionModal
        open={isUploadModalOpen}
        projectId={project.id}
        onClose={() => setIsUploadModalOpen(false)}
        onComplete={handleUploadComplete}
      />
    </section>
  );
}
